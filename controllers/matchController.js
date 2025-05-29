const Match = require('../models/Match');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const Team = require('../models/Team');

// @desc    Get all matches
// @route   GET /api/v1/matches
// @access  Public
exports.getMatches = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single match
// @route   GET /api/v1/matches/:id
// @access  Public
exports.getMatch = asyncHandler(async (req, res, next) => {
  const match = await Match.findById(req.params.id);

  if (!match) {
    return next(
      new ErrorResponse(`Confronto não encontrado com o id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: match
  });
});

// @desc    Create match
// @route   POST /api/v1/matches
// @access  Private/Admin
exports.createMatch = asyncHandler(async (req, res, next) => {
  // Check if teams exist
  const timeCasa = await Team.findOne({ teamName: req.body.timeCasa });
  const timeFora = await Team.findOne({ teamName: req.body.timeFora });

  if (!timeCasa || !timeFora) {
    return next(
      new ErrorResponse(`Um ou ambos os times não foram encontrados`, 404)
    );
  }

  const match = await Match.create(req.body);

  res.status(201).json({
    success: true,
    data: match
  });
});

// @desc    Update match
// @route   PUT /api/v1/matches/:id
// @access  Private/Admin
exports.updateMatch = asyncHandler(async (req, res, next) => {
  let match = await Match.findById(req.params.id);

  if (!match) {
    return next(
      new ErrorResponse(`Confronto não encontrado com o id ${req.params.id}`, 404)
    );
  }

  match = await Match.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: match
  });
});

// @desc    Update match score
// @route   PUT /api/v1/matches/:id/score
// @access  Private/Admin
exports.updateMatchScore = asyncHandler(async (req, res, next) => {
  let match = await Match.findById(req.params.id);

  if (!match) {
    return next(
      new ErrorResponse(`Confronto não encontrado com o id ${req.params.id}`, 404)
    );
  }

  // Update score
  match.placar = req.body.placar;
  match.status = 'finalizado';

  await match.save();

  // Update scoreboard
  await updateScoreboard(match);

  res.status(200).json({
    success: true,
    data: match
  });
});

// @desc    Delete match
// @route   DELETE /api/v1/matches/:id
// @access  Private/Admin
exports.deleteMatch = asyncHandler(async (req, res, next) => {
  const match = await Match.findById(req.params.id);

  if (!match) {
    return next(
      new ErrorResponse(`Confronto não encontrado com o id ${req.params.id}`, 404)
    );
  }

 await Match.deleteOne({ _id: req.params._id });
  res.status(200).json({
    success: true,
    data: {}
  });
});


const updateScoreboard = async (match) => {
  const { timeCasa, timeFora, placar, modalidade, naipe, categoria, cidade } = match;

  const scoreboardCasa = await Scoreboard.findOneAndUpdate(
    { time: timeCasa, modalidade, naipe, categoria, cidade },
    { $inc: { jogos: 1 } },
    { new: true, upsert: true }
  );

  const scoreboardFora = await Scoreboard.findOneAndUpdate(
    { time: timeFora, modalidade, naipe, categoria, cidade },
    { $inc: { jogos: 1 } },
    { new: true, upsert: true }
  );

  // Update based on match result
  if (placar.timeCasa > placar.timeFora) {
    // Home team won
    await Scoreboard.findByIdAndUpdate(scoreboardCasa._id, {
      $inc: { vitorias: 1, pontos: 3 }
    });
    await Scoreboard.findByIdAndUpdate(scoreboardFora._id, {
      $inc: { derrotas: 1 }
    });
  } else if (placar.timeCasa < placar.timeFora) {
    // Away team won
    await Scoreboard.findByIdAndUpdate(scoreboardFora._id, {
      $inc: { vitorias: 1, pontos: 3 }
    });
    await Scoreboard.findByIdAndUpdate(scoreboardCasa._id, {
      $inc: { derrotas: 1 }
    });
  } else {
    // Draw
    await Scoreboard.findByIdAndUpdate(scoreboardCasa._id, {
      $inc: { empates: 1, pontos: 1 }
    });
    await Scoreboard.findByIdAndUpdate(scoreboardFora._id, {
      $inc: { empates: 1, pontos: 1 }
    });
  }

  // Update specific stats based on modality
  if (modalidade === 'futevolei') {
    await Scoreboard.findByIdAndUpdate(scoreboardCasa._id, {
      $inc: { pontosPro: placar.timeCasa, pontosContra: placar.timeFora }
    });
    await Scoreboard.findByIdAndUpdate(scoreboardFora._id, {
      $inc: { pontosPro: placar.timeFora, pontosContra: placar.timeCasa }
    });
  } else if (modalidade === 'handball') {
    await Scoreboard.findByIdAndUpdate(scoreboardCasa._id, {
      $inc: { golsPro: placar.timeCasa, golsContra: placar.timeFora }
    });
    await Scoreboard.findByIdAndUpdate(scoreboardFora._id, {
      $inc: { golsPro: placar.timeFora, golsContra: placar.timeCasa }
    });
  } else {
    // For other sports with sets
    if (placar.sets && placar.sets.length > 0) {
      const setsCasa = placar.sets.filter(set => set.timeCasa > set.timeFora).length;
      const setsFora = placar.sets.filter(set => set.timeFora > set.timeCasa).length;

      await Scoreboard.findByIdAndUpdate(scoreboardCasa._id, {
        $inc: { setsPro: setsCasa, setsContra: setsFora }
      });
      await Scoreboard.findByIdAndUpdate(scoreboardFora._id, {
        $inc: { setsPro: setsFora, setsContra: setsCasa }
      });
    }
  }
};