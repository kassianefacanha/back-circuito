const News = require('../models/News');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');

// @desc    Get all news
// @route   GET /api/v1/news
// @access  Public
exports.getNews = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single news
// @route   GET /api/v1/news/:id
// @access  Public
exports.getNew = asyncHandler(async (req, res, next) => {
  const news = await News.findById(req.params.id);

  if (!news) {
    return next(
      new ErrorResponse(`Notícia não encontrada com o id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: news
  });
});

// @desc    Create news
// @route   POST /api/v1/news
// @access  Private/Admin
exports.createNews = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.autor = req.user.name;

  // Remova o _id do corpo da requisição se existir
  if (req.body._id) {
    delete req.body._id;
  }

  const news = await News.create(req.body);

  res.status(201).json({
    success: true,
    data: news
  });
});

// @desc    Update news
// @route   PUT /api/v1/news/:id
// @access  Private/Admin
exports.updateNews = asyncHandler(async (req, res, next) => {
  let news = await News.findById(req.params.id);

  if (!news) {
    return next(
      new ErrorResponse(`Notícia não encontrada com o id ${req.params.id}`, 404)
    );
  }

  news = await News.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: news
  });
});

// @desc    Delete news
// @route   DELETE /api/v1/news/:id
// @access  Private/Admin
exports.deleteNews = asyncHandler(async (req, res, next) => {
  const news = await News.findById(req.params.id);

  if (!news) {
    return next(
      new ErrorResponse(`Notícia não encontrada com o id ${req.params.id}`, 404)
    );
  }

  // Método atualizado - escolha uma das opções abaixo:

  // Opção 1: Usando deleteOne() no documento
  // await news.deleteOne();

  // Ou Opção 2: Usando findByIdAndDelete() diretamente
  await News.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});