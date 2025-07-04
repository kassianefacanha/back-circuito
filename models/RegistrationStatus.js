// models/RegistrationStatus.js
const mongoose = require('mongoose');

const RegistrationStatusSchema = new mongoose.Schema({
  city: {
    type: String,
    required: [true, 'Por favor, informe a cidade'],
    enum: ['Fortaleza', 'Aquiraz'],
    unique: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  message: {
    type: String,
    default: 'Inscrições abertas'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para atualizar a data de modificação
RegistrationStatusSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RegistrationStatus', RegistrationStatusSchema);