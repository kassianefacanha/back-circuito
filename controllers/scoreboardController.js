const Scoreboard = require('../models/Scoreboard');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');

// @desc    Get all scoreboards
// @route   GET /api/v1/scoreboards
// @access  Public
exports.getScoreboards = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single scoreboard
// @route   GET /api/v1/scoreboards/:id
// @access  Public
exports.getScoreboard = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return next(new ErrorResponse('ID deve ser um número', 400));
  }

  const scoreboard = await Scoreboard.findById(id);

  if (!scoreboard) {
    return next(
      new ErrorResponse(`Tabela de pontos não encontrada com o id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: scoreboard
  });
});

// @desc    Create scoreboard
// @route   POST /api/v1/scoreboards
// @access  Private/Admin
exports.createScoreboard = asyncHandler(async (req, res, next) => {
  const scoreboard = await Scoreboard.create(req.body);

  res.status(201).json({
    success: true,
    data: scoreboard
  });
});

// @desc    Update scoreboard
// @route   PUT /api/v1/scoreboards/:id
// @access  Private/Admin
exports.updateScoreboard = asyncHandler(async (req, res, next) => {
  let scoreboard = await Scoreboard.findById(req.params.id);

  if (!scoreboard) {
    return next(
      new ErrorResponse(`Tabela de pontos não encontrada com o id ${req.params.id}`, 404)
    );
  }

  scoreboard = await Scoreboard.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: scoreboard
  });
});

// @desc    Delete scoreboard
// @route   DELETE /api/v1/scoreboards/:id
// @access  Private/Admin
exports.deleteScoreboard = asyncHandler(async (req, res, next) => {
  const scoreboard = await Scoreboard.findById(req.params.id);

  if (!scoreboard) {
    return next(
      new ErrorResponse(`Tabela de pontos não encontrada com o id ${req.params.id}`, 404)
    );
  }

  await Scoreboard.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    data: {}
  });
});