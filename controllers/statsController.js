const User = require('../models/User');
const Team = require('../models/Team');
const Match = require('../models/Match');
const News = require('../models/News');
const Scoreboard = require('../models/Scoreboard');
const asyncHandler = require('../middlewares/async');

// @desc    Get all statistics
// @route   GET /api/v1/stats
// @access  Public
exports.getStats = asyncHandler(async (req, res, next) => {
  try {
    // Users stats
    const totalUsers = await User.countDocuments();
    const usersByCity = await User.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } }
    ]);
    const usersByGender = await User.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // Teams stats
    const totalTeams = await Team.countDocuments();
    const teamsByCity = await Team.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } }
    ]);
    const teamsByModality = await Team.aggregate([
      { $group: { _id: '$modality', count: { $sum: 1 } } }
    ]);
    const teamsByCategory = await Team.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const teamsByGender = await Team.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // Athletes stats
    const athletesByGender = await Team.aggregate([
      { $unwind: '$athletes' },
      { 
        $group: { 
          _id: '$athletes.gender',
          count: { $sum: 1 }
        } 
      }
    ]);

    const athletesByModality = await Team.aggregate([
      { $unwind: '$athletes' },
      { 
        $group: { 
          _id: '$modality',
          count: { $sum: 1 }
        } 
      }
    ]);

    const athletesByCategory = await Team.aggregate([
      { $unwind: '$athletes' },
      { 
        $group: { 
          _id: '$category',
          count: { $sum: 1 }
        } 
      }
    ]);

    const totalAthletesResult = await Team.aggregate([
      { $unwind: '$athletes' },
      { $count: 'total' }
    ]);
    const totalAthletes = totalAthletesResult[0] ? totalAthletesResult[0].total : 0;

    // Matches stats
    const totalMatches = await Match.countDocuments();
    const matchesByStatus = await Match.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const matchesByModality = await Match.aggregate([
      { $group: { _id: '$modalidade', count: { $sum: 1 } } }
    ]);
    const matchesByCity = await Match.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } }
    ]);

    // News stats
    const totalNews = await News.countDocuments();
    const newsByCity = await News.aggregate([
      { $group: { _id: '$cidade', count: { $sum: 1 } } }
    ]);
    const newsByModality = await News.aggregate([
      { $group: { _id: '$modalidade', count: { $sum: 1 } } }
    ]);

    // Scoreboard stats
    const scoreboardStats = await Scoreboard.aggregate([
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$pontos' },
          totalGames: { $sum: '$jogos' },
          totalWins: { $sum: '$vitorias' },
          totalDraws: { $sum: '$empates' },
          totalLosses: { $sum: '$derrotas' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          byCity: usersByCity,
          byGender: usersByGender
        },
        teams: {
          total: totalTeams,
          byCity: teamsByCity,
          byModality: teamsByModality,
          byCategory: teamsByCategory,
          byGender: teamsByGender
        },
        athletes: {
          total: totalAthletes,
          byModality: athletesByModality,
          byCategory: athletesByCategory,
          byGender: athletesByGender
        },
        matches: {
          total: totalMatches,
          byStatus: matchesByStatus,
          byModality: matchesByModality,
          byCity: matchesByCity
        },
        news: {
          total: totalNews,
          byCity: newsByCity,
          byModality: newsByModality
        },
        scoreboard: scoreboardStats[0] || {}
      }
    });
  } catch (error) {
    console.error('Error in getStats:', error);
    next(error);
  }
});

// @desc    Get statistics by city
// @route   GET /api/v1/stats/:city
// @access  Public
exports.getStatsByCity = asyncHandler(async (req, res, next) => {
  try {
    const city = req.params.city;

    // Validate city
    if (!['Fortaleza', 'Aquiraz'].includes(city)) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, especifique Fortaleza ou Aquiraz'
      });
    }

    // Users stats
    const totalUsers = await User.countDocuments({ city });
    const usersByGender = await User.aggregate([
      { $match: { city } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // Teams stats
    const totalTeams = await Team.countDocuments({ city });
    const teamsByModality = await Team.aggregate([
      { $match: { city } },
      { $group: { _id: '$modality', count: { $sum: 1 } } }
    ]);
    const teamsByCategory = await Team.aggregate([
      { $match: { city } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const teamsByGender = await Team.aggregate([
      { $match: { city } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // Athletes stats
    const athletesByGender = await Team.aggregate([
      { $match: { city } },
      { $unwind: '$athletes' },
      { 
        $group: { 
          _id: '$athletes.gender',
          count: { $sum: 1 }
        } 
      }
    ]);

    const athletesByModality = await Team.aggregate([
      { $match: { city } },
      { $unwind: '$athletes' },
      { 
        $group: { 
          _id: '$modality',
          count: { $sum: 1 }
        } 
      }
    ]);

    const athletesByCategory = await Team.aggregate([
      { $match: { city } },
      { $unwind: '$athletes' },
      { 
        $group: { 
          _id: '$category',
          count: { $sum: 1 }
        } 
      }
    ]);

    const totalAthletesResult = await Team.aggregate([
      { $match: { city } },
      { $unwind: '$athletes' },
      { $count: 'total' }
    ]);
    const totalAthletes = totalAthletesResult[0] ? totalAthletesResult[0].total : 0;

    // Matches stats
    const totalMatches = await Match.countDocuments({ city });
    const matchesByStatus = await Match.aggregate([
      { $match: { city } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const matchesByModality = await Match.aggregate([
      { $match: { city } },
      { $group: { _id: '$modalidade', count: { $sum: 1 } } }
    ]);

    // News stats
    const totalNews = await News.countDocuments({ cidade: city });
    const newsByModality = await News.aggregate([
      { $match: { cidade: city } },
      { $group: { _id: '$modalidade', count: { $sum: 1 } } }
    ]);

    // Scoreboard stats
    const scoreboardStats = await Scoreboard.aggregate([
      { $match: { city } },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$pontos' },
          totalGames: { $sum: '$jogos' },
          totalWins: { $sum: '$vitorias' },
          totalDraws: { $sum: '$empates' },
          totalLosses: { $sum: '$derrotas' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        city,
        users: {
          total: totalUsers,
          byGender: usersByGender
        },
        teams: {
          total: totalTeams,
          byModality: teamsByModality,
          byCategory: teamsByCategory,
          byGender: teamsByGender
        },
        athletes: {
          total: totalAthletes,
          byModality: athletesByModality,
          byCategory: athletesByCategory,
          byGender: athletesByGender
        },
        matches: {
          total: totalMatches,
          byStatus: matchesByStatus,
          byModality: matchesByModality
        },
        news: {
          total: totalNews,
          byModality: newsByModality
        },
        scoreboard: scoreboardStats[0] || {}
      }
    });
  } catch (error) {
    console.error('Error in getStatsByCity:', error);
    next(error);
  }
});