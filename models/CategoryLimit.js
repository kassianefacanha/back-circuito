// models/CategoryLimit.js
const mongoose = require('mongoose');

const CategoryLimitSchema = new mongoose.Schema({
  city: {
    type: String,
    required: [true, 'Por favor, informe a cidade'],
    enum: ['Fortaleza', 'Aquiraz']
  },
  modality: {
    type: String,
    required: [true, 'Por favor, informe a modalidade'],
    enum: ['volei', 'beach-tennis', 'futevolei']
  },
  category: {
    type: String,
    required: [true, 'Por favor, informe a categoria'],
    enum: ['INICIANTE', 'INTERMEDIÁRIO', 'AVANÇADO', '4X4', 'MISTO']
  },
  gender: {
    type: String,
    required: [true, 'Por favor, informe o gênero'],
    enum: ['masculino', 'feminino', 'misto']
  },
  maxTeams: {
    type: Number,
    required: [true, 'Por favor, informe o número máximo de equipes']
  },
  teamSize: {
    type: Number,
    required: [true, 'Por favor, informe o tamanho da equipe']
  },
  isSoldOut: {
    type: Boolean,
    default: false
  },
  whatsappLink: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Por favor, informe um link válido'
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índice composto para garantir unicidade
CategoryLimitSchema.index(
  { city: 1, modality: 1, category: 1, gender: 1 },
  { unique: true }
);

// Middleware para atualizar a data de modificação
CategoryLimitSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CategoryLimit', CategoryLimitSchema);