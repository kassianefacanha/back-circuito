const express = require('express');
const {
  getMatches,
  getMatch,
  createMatch,
  updateMatch,
  updateMatchScore,
  deleteMatch
} = require('../controllers/matchController');

const router = express.Router();

const { protect, authorize } = require('../middlewares/auth');
const advancedResults = require('../middlewares/advancedResults');
const Match = require('../models/Match');

router
  .route('/')
  .get(advancedResults(Match), getMatches)
  .post(protect, authorize('admin'), createMatch);

router
  .route('/:id')
  .get(getMatch)
  .put(protect, authorize('admin'), updateMatch)
  .delete(protect, authorize('admin'), deleteMatch);

router
  .route('/:id/score')
  .put(protect, authorize('admin'), updateMatchScore);

module.exports = router;