const Team = require('../models/Team');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const multer = require('multer');
const path = require('path');

// Configuração simplificada do Multer
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

// Middleware customizado para lidar com arrays dinâmicos
exports.uploadTeamPhotos = (req, res, next) => {
  // Criar um array com todos os campos de arquivo esperados
  const uploadFields = [];
  if (req.body.athletes && req.body.athletes.length) {
    req.body.athletes.forEach((_, index) => {
      uploadFields.push({ name: `athletes[${index}][photo]` });
    });
  }

  // Usar o Multer para processar os arquivos
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
// @route   GET /api/v1/teams?city=Fortaleza
// @route   GET /api/v1/teams?modality=Futebol
// @route   GET /api/v1/teams?category=Sub20
// @route   GET /api/v1/teams?gender=masculino
// @access  Public
exports.getTeams = asyncHandler(async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Finding resource
  query = Team.find(JSON.parse(queryStr));

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Team.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const teams = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: teams.length,
    pagination,
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
    // Processar os dados do time
    let teamData;
    try {
      teamData = req.body;
      // Se os atletas vieram como string, parsear
      if (typeof teamData.athletes === 'string') {
        teamData.athletes = JSON.parse(teamData.athletes);
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Formato de dados inválido'
      });
    }

    // Associar fotos aos atletas
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
    if (!teamData.city) teamData.city = req.params.city;

    const team = await Team.create(teamData);
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    console.error('Erro ao criar time:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno no servidor'
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

  // Make sure user is team owner or admin
  if (team.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `Usuário ${req.user.id} não está autorizado a atualizar este time`,
        401
      )
    );
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

  // Make sure user is team owner or admin
  if (team.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `Usuário ${req.user.id} não está autorizado a deletar este time`,
        401
      )
    );
  }

  await team.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});