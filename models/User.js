const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Por favor, adicione um nome']
    },
    email: {
        type: String,
        required: [true, 'Por favor, adicione um email'],
        unique: true,
        validate: [validator.isEmail, 'Por favor, adicione um email válido']
    },
    password: {
        type: String,
        required: [true, 'Por favor, adicione uma senha'],
        minlength: 6,
        select: false
    },
    phone: {
        type: String,
        required: [true, 'Por favor, adicione um telefone']
    },
    confirmPassword: {
        type: String,
        required: [true, 'Por favor, confirme a senha'],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: 'As senhas não são iguais!'
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    resetPasswordCode: {
        type: String,
        select: false
    },
    resetPasswordExpire: {
        type: Date,
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Método para comparar senhas
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware para hash da senha
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.confirmPassword = undefined;
    next();
});

// Método para gerar token JWT
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Método para gerar e armazenar código de reset
UserSchema.methods.generateResetPasswordCode = function() {
  // Gera código numérico de 6 dígitos
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Armazena o código original (não o hash) para comparação direta
  this.resetPasswordCode = resetCode;
  
  // Define expiração (10 minutos)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetCode;
};

// Método para verificar o código de reset
UserSchema.methods.isValidResetCode = function(code) {
  // Verifica se há código e se não expirou
  if (!this.resetPasswordCode || !this.resetPasswordExpire) {
    return false;
  }
  
  // Comparação direta (case sensitive) e verificação de tempo
  return this.resetPasswordCode === code.toString().trim() && 
         this.resetPasswordExpire > Date.now();
};

module.exports = mongoose.model('User', UserSchema);