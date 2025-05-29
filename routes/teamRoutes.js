const express = require('express');
const router = express.Router();
const {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  uploadTeamPhotos // Novo middleware que vamos criar
} = require('../controllers/teamController');
const advancedResults = require('../middlewares/advancedResults');
const { protect, authorize } = require('../middlewares/auth');
const Team = require('../models/Team');

// Rotas
router
  .route('/')
  .get(advancedResults(Team, 'athletes'), getTeams)
  .post(protect, uploadTeamPhotos, createTeam); 

router
  .route('/:id')
  .get(getTeam)
  .put(protect, updateTeam)
  .delete(protect, deleteTeam);

module.exports = router;