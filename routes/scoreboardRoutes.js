const express = require('express');
const {
  getScoreboards,
  getScoreboard,
  createScoreboard,
  updateScoreboard,
  deleteScoreboard
} = require('../controllers/scoreboardController');

const router = express.Router();

const { protect, authorize } = require('../middlewares/auth');
const advancedResults = require('../middlewares/advancedResults');
const Scoreboard = require('../models/Scoreboard');

router
  .route('/')
  .get(advancedResults(Scoreboard), getScoreboards)
  .post(protect, authorize('admin'), createScoreboard);

router
  .route('/:id')
  .get(getScoreboard)
  .put(protect, authorize('admin'), updateScoreboard)
  .delete(protect, authorize('admin'), deleteScoreboard);

module.exports = router;