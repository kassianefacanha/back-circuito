const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
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
  timeCasa: {
    type: String,
    required: [true, 'Por favor, adicione o time da casa']
  },
  timeFora: {
    type: String,
    required: [true, 'Por favor, adicione o time visitante']
  },
  data: {
    type: Date,
    required: [true, 'Por favor, adicione a data do jogo']
  },
  hora: {
    type: String,
    required: [true, 'Por favor, adicione o horário do jogo']
  },
  local: {
    type: String,
    required: [true, 'Por favor, adicione o local do jogo']
  },
  cidade: {
    type: String,
    enum: ['Fortaleza', 'Aquiraz'],
    required: [true, 'Por favor, especifique a cidade']
  },
  placar: {
    timeCasa: {
      type: Number,
      default: 0
    },
    timeFora: {
      type: Number,
      default: 0
    },
    sets: [
      {
        timeCasa: Number,
        timeFora: Number
      }
    ]
  },
  status: {
    type: String,
    enum: ['agendado', 'em_andamento', 'finalizado', 'cancelado'],
    default: 'agendado'
  }
});

module.exports = mongoose.model('Match', MatchSchema);