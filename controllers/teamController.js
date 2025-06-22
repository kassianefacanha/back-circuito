const Team = require('../models/Team');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const multer = require('multer');
const path = require('path');

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Middleware para upload de fotos
exports.uploadTeamPhotos = (req, res, next) => {
  const uploadFields = [];
  if (req.body.athletes && req.body.athletes.length) {
    req.body.athletes.forEach((_, index) => {
      uploadFields.push({ name: `athletes[${index}][photo]` });
    });
  }

  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message.includes('File too large') 
          ? 'O arquivo é muito grande (máximo 5MB)' 
          : 'Erro no upload de arquivos'
      });
    }
    next();
  });
};

// @desc    Get all teams
// @route   GET /api/v1/teams
// @access  Public
exports.getTeams = asyncHandler(async (req, res, next) => {
  let query;

  const reqQuery = { ...req.query };
  const removeFields = ['select', 'sort', 'page', 'limit'];
  removeFields.forEach(param => delete reqQuery[param]);

  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  query = Team.find(JSON.parse(queryStr));

  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  const teams = await query;

  res.status(200).json({
    success: true,
    count: teams.length,
    data: teams
  });
});

// @desc    Get single team
// @route   GET /api/v1/teams/:id
// @access  Public
exports.getTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.id);

  if (!team) {
    return next(
      new ErrorResponse(`Time não encontrado com o id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: team
  });
});

// @desc    Create team
// @route   POST /api/v1/teams
// @access  Private
exports.createTeam = asyncHandler(async (req, res, next) => {
  try {
    let teamData;
    try {
      teamData = req.body;
      if (typeof teamData.athletes === 'string') {
        teamData.athletes = JSON.parse(teamData.athletes);
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Formato de dados inválido. Verifique a estrutura dos dados enviados.'
      });
    }

    // Verificar nome do time único
    const existingTeam = await Team.findOne({ teamName: teamData.teamName });
    if (existingTeam) {
      return res.status(409).json({
        success: false,
        error: 'Já existe um time com este nome. Por favor, escolha outro nome.'
      });
    }

    // Definir cidade
    const city = teamData.city || req.params.city;
    if (!city) {
      return res.status(400).json({
        success: false,
        error: 'Cidade não especificada.'
      });
    }

    // Verificar atletas
    if (teamData.athletes && teamData.athletes.length > 0) {
      // Verificar duplicatas na requisição
      const cpfs = teamData.athletes.map(a => a.cpf);
      if (new Set(cpfs).size !== cpfs.length) {
        return res.status(400).json({
          success: false,
          error: 'Existem CPFs duplicados na lista de atletas.'
        });
      }

      const rgs = teamData.athletes.map(a => a.rg);
      if (new Set(rgs).size !== rgs.length) {
        return res.status(400).json({
          success: false,
          error: 'Existem RGs duplicados na lista de atletas.'
        });
      }

      // Verificar no banco de dados (na mesma cidade)
      for (const athlete of teamData.athletes) {
        const existingAthlete = await Team.findOne({
          city: city,
          'athletes.cpf': athlete.cpf
        });
        
        if (existingAthlete) {
          return res.status(409).json({
            success: false,
            error: `O CPF ${athlete.cpf} já está cadastrado em outro time na cidade de ${city}.`
          });
        }

        const existingAthleteByRg = await Team.findOne({
          city: city,
          'athletes.rg': athlete.rg
        });
        
        if (existingAthleteByRg) {
          return res.status(409).json({
            success: false,
            error: `O RG ${athlete.rg} já está cadastrado em outro time na cidade de ${city}.`
          });
        }
      }
    }

    // Associar fotos
    if (req.files && req.files.length > 0) {
      teamData.athletes = teamData.athletes.map((athlete, index) => {
        const photoFile = req.files.find(file => 
          file.fieldname.includes(`athletes[${index}][photo]`)
        );
        return {
          ...athlete,
          photo: photoFile ? `/uploads/${photoFile.filename}` : null
        };
      });
    }

    // Adicionar usuário e cidade
    teamData.user = req.user.id;
    teamData.city = city;

    const team = await Team.create(teamData);
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    console.error('Erro ao criar time:', error);
    
    if (error.name === 'MongoServerError' && error.code === 11000) {
      let errorMessage = 'Erro de duplicata: ';
      
      if (error.message.includes('teamName_1')) {
        errorMessage = 'Já existe um time com este nome. Por favor, escolha outro nome.';
      } else if (error.message.includes('athletes.cpf_1_city_1')) {
        errorMessage = 'Um ou mais CPFs já estão cadastrados em outros times na mesma cidade.';
      } else if (error.message.includes('athletes.rg_1_city_1')) {
        errorMessage = 'Um ou mais RGs já estão cadastrados em outros times na mesma cidade.';
      }
      
      return res.status(409).json({
        success: false,
        error: errorMessage
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.'
    });
  }
});

// @desc    Update team
// @route   PUT /api/v1/teams/:id
// @access  Private
exports.updateTeam = asyncHandler(async (req, res, next) => {
  let team = await Team.findById(req.params.id);

  if (!team) {
    return next(
      new ErrorResponse(`Time não encontrado com o id ${req.params.id}`, 404)
    );
  }

  // Verificar autorização
  if (team.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `Usuário ${req.user.id} não está autorizado a atualizar este time`,
        401
      )
    );
  }

  // Verificar atletas se estiver atualizando
  if (req.body.athletes) {
    const city = team.city;
    
    for (const athlete of req.body.athletes) {
      if (athlete.cpf) {
        const existingAthlete = await Team.findOne({
          _id: { $ne: req.params.id },
          city: city,
          'athletes.cpf': athlete.cpf
        });
        
        if (existingAthlete) {
          return next(
            new ErrorResponse(
              `O CPF ${athlete.cpf} já está cadastrado em outro time na cidade de ${city}.`,
              409
            )
          );
        }
      }

      if (athlete.rg) {
        const existingAthleteByRg = await Team.findOne({
          _id: { $ne: req.params.id },
          city: city,
          'athletes.rg': athlete.rg
        });
        
        if (existingAthleteByRg) {
          return next(
            new ErrorResponse(
              `O RG ${athlete.rg} já está cadastrado em outro time na cidade de ${city}.`,
              409
            )
          );
        }
      }
    }
  }

  team = await Team.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: team
  });
});

// @desc    Delete team
// @route   DELETE /api/v1/teams/:id
// @access  Private
exports.deleteTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.id);

  if (!team) {
    return next(
      new ErrorResponse(`Time não encontrado com o id ${req.params.id}`, 404)
    );
  }

  if (team.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `Usuário ${req.user.id} não está autorizado a deletar este time`,
        401
      )
    );
  }

  await Team.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    data: {}
  });
});