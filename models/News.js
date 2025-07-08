const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Por favor, adicione um título'],
    trim: true,
    maxlength: [100, 'Título não pode ter mais que 100 caracteres']
  },
  resumo: {
    type: String,
    required: [true, 'Por favor, adicione um resumo'],
    maxlength: [500, 'Resumo não pode ter mais que 500 caracteres']
  },
  data: {
    type: Date,
    default: Date.now
  },
  autor: {
    type: String,
    required: [true, 'Por favor, adicione o nome do autor']
  },
  modalidade: {
    type: String,
    required: [true, 'Por favor, especifique a modalidade']
  },
  cidade: {
    type: String,
    enum: ['Fortaleza', 'Aquiraz', 'Ambas'],
    required: [true, 'Por favor, especifique a cidade']
  },
  link: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Por favor, use um URL válido com HTTP ou HTTPS'
    ],
    default: ''
  }
});

module.exports = mongoose.model('News', NewsSchema);