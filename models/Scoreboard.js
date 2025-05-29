const mongoose = require('mongoose');

const ScoreboardSchema = new mongoose.Schema({
  modalidade: {
    type: String,
    required: [true, 'Por favor, especifique a modalidade']
  },
  naipe: {
    type: String,
    enum: ['MASCULINO', 'FEMININO', 'MISTO'],
    required: [true, 'Por favor, especifique o naipe']
  },
  categoria: {
    type: String,
    required: [true, 'Por favor, especifique a categoria']
  },
  time: {
    type: String,
    required: [true, 'Por favor, adicione o nome do time']
  },
  cidade: {
    type: String,
    enum: ['Fortaleza', 'Aquiraz'],
    required: [true, 'Por favor, especifique a cidade']
  },
  pontos: {
    type: Number,
    default: 0
  },
  jogos: {
    type: Number,
    default: 0
  },
  vitorias: {
    type: Number,
    default: 0
  },
  empates: {
    type: Number,
    default: 0
  },
  derrotas: {
    type: Number,
    default: 0
  },
  pontosPro: {
    type: Number,
    default: 0
  },
  pontosContra: {
    type: Number,
    default: 0
  },
  golsPro: {
    type: Number,
    default: 0
  },
  golsContra: {
    type: Number,
    default: 0
  },
  setsPro: {
    type: Number,
    default: 0
  },
  setsContra: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Scoreboard', ScoreboardSchema);