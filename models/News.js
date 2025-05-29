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
  }
});

module.exports = mongoose.model('News', NewsSchema);