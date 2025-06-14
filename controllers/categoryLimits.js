const CategoryLimit = require('../models/CategoryLimit');
const Team = require('../models/Team'); // Adicionei esta importação que estava faltando
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const { fortalezaCapacityLimits, aquirazCapacityLimits } = require('../config/capacityLimits');

// Função reutilizável para inicializar limites se o banco estiver vazio
const initializeLimitsIfEmpty = async () => {
  try {
    const existingLimits = await CategoryLimit.countDocuments();
    if (existingLimits > 0) return false;

    const limitsToCreate = [];

    // Adicionar limites de Fortaleza
    for (const [modality, categories] of Object.entries(fortalezaCapacityLimits)) {
      for (const [category, genders] of Object.entries(categories)) {
        for (const [gender, limits] of Object.entries(genders)) {
          limitsToCreate.push({
            city: 'Fortaleza',
            modality,
            category,
            gender,
            maxTeams: limits.maxTeams,
            teamSize: limits.teamSize,
            isSoldOut: false,
            whatsappLink: ''
          });
        }
      }
    }

    // Adicionar limites de Aquiraz
    for (const [modality, categories] of Object.entries(aquirazCapacityLimits)) {
      for (const [category, genders] of Object.entries(categories)) {
        for (const [gender, limits] of Object.entries(genders)) {
          limitsToCreate.push({
            city: 'Aquiraz',
            modality,
            category,
            gender,
            maxTeams: limits.maxTeams,
            teamSize: limits.teamSize,
            isSoldOut: false,
            whatsappLink: ''
          });
        }
      }
    }

    await CategoryLimit.insertMany(limitsToCreate);
    console.log('Limites de categoria inicializados automaticamente');
    return true;
  } catch (err) {
    console.error('Erro ao inicializar limites automaticamente:', err);
    return false;
  }
};

// @desc    Initialize category limits (endpoint manual)
// @route   POST /api/v1/category-limits/initialize
// @access  Private (Admin)
exports.initializeLimits = asyncHandler(async (req, res, next) => {
  const wasInitialized = await initializeLimitsIfEmpty();
  
  if (!wasInitialized) {
    return next(
      new ErrorResponse('Os limites já foram inicializados anteriormente', 400)
    );
  }

  res.status(201).json({
    success: true,
    data: { message: 'Limites inicializados com sucesso' }
  });
});

// @desc    Get all category limits (com auto-inicialização)
// @route   GET /api/v1/category-limits
// @access  Private (Admin)
exports.getCategoryLimits = asyncHandler(async (req, res, next) => {
  await initializeLimitsIfEmpty();
  res.status(200).json(res.advancedResults);
});

// @desc    Get category limits by city (com auto-inicialização)
// @route   GET /api/v1/category-limits/:city
// @access  Public
exports.getCategoryLimitsByCity = asyncHandler(async (req, res, next) => {
  const city = req.params.city;
  
  if (!['Fortaleza', 'Aquiraz'].includes(city)) {
    return next(new ErrorResponse('Cidade inválida', 400));
  }

  await initializeLimitsIfEmpty();

  const limits = await CategoryLimit.find({ city });
  
  res.status(200).json({
    success: true,
    count: limits.length,
    data: limits
  });
});

// @desc    Get single category limit
// @route   GET /api/v1/category-limits/:id
// @access  Private (Admin)
exports.getCategoryLimit = asyncHandler(async (req, res, next) => {
  const limit = await CategoryLimit.findById(req.params.id);

  if (!limit) {
    return next(
      new ErrorResponse(
        `Limite não encontrado com o id ${req.params.id}`,
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    data: limit
  });
});

// @desc    Update category limit
// @route   PUT /api/v1/category-limits/:id
// @access  Private (Admin)
exports.updateCategoryLimit = asyncHandler(async (req, res, next) => {
  const { maxTeams, teamSize, isSoldOut, whatsappLink } = req.body;
  
  const limit = await CategoryLimit.findById(req.params.id);

  if (!limit) {
    return next(
      new ErrorResponse(
        `Limite não encontrado com o id ${req.params.id}`,
        404
      )
    );
  }

  if (maxTeams !== undefined) limit.maxTeams = maxTeams;
  if (teamSize !== undefined) limit.teamSize = teamSize;
  if (isSoldOut !== undefined) limit.isSoldOut = isSoldOut;
  if (whatsappLink !== undefined) limit.whatsappLink = whatsappLink;

  await limit.save();

  res.status(200).json({
    success: true,
    data: limit
  });
});

// @desc    Get current capacity stats (com auto-inicialização)
// @route   GET /api/v1/category-limits/stats/:city
// @access  Public
exports.getCapacityStats = asyncHandler(async (req, res, next) => {
  const city = req.params.city;
  
  await initializeLimitsIfEmpty();
  
  const [limits, teamsCount] = await Promise.all([
    CategoryLimit.find({ city }),
    Team.aggregate([
      { $match: { city } },
      { $group: { 
        _id: {
          modality: "$modality",
          category: "$category",
          gender: "$gender"
        },
        count: { $sum: 1 }
      }}
    ])
  ]);
  
  const stats = limits.map(limit => {
    const teamCount = teamsCount.find(t => 
      t._id.modality === limit.modality &&
      t._id.category === limit.category &&
      t._id.gender === limit.gender
    );
    
    return {
      id: limit._id,
      city: limit.city,
      modality: limit.modality,
      category: limit.category,
      gender: limit.gender,
      maxTeams: limit.maxTeams,
      teamSize: limit.teamSize,
      currentTeams: teamCount ? teamCount.count : 0,
      remainingSlots: limit.maxTeams - (teamCount ? teamCount.count : 0),
      isSoldOut: limit.isSoldOut,
      whatsappLink: limit.whatsappLink
    };
  });

  res.status(200).json({
    success: true,
    data: stats
  });
});