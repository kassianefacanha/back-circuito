const express = require('express');
const {
  getNews,
  getNew,
  createNews,
  updateNews,
  deleteNews
} = require('../controllers/newsController');

const router = express.Router();

const { protect, authorize } = require('../middlewares/auth');
const advancedResults = require('../middlewares/advancedResults');
const News = require('../models/News');

router
  .route('/')
  .get(advancedResults(News), getNews)
  .post(protect, authorize('admin'), createNews);

router
  .route('/:id')
  .get(getNew)
  .put(protect, authorize('admin'), updateNews)
  .delete(protect, authorize('admin'), deleteNews);

module.exports = router;