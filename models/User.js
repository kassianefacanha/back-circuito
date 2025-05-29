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

// Gerar código de redefinição de 6 dígitos
UserSchema.methods.generateResetPasswordCode = function () {
    // Gerar código numérico de 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash do código para armazenamento seguro
    this.resetPasswordCode = crypto
        .createHash('sha256')
        .update(resetCode)
        .digest('hex');

    // Definir expiração (10 minutos)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetCode;
};

// Verificar se o código de reset é válido
UserSchema.methods.isValidResetCode = function (code) {
    const hashedCode = crypto
        .createHash('sha256')
        .update(code)
        .digest('hex');

    return hashedCode === this.resetPasswordCode &&
        this.resetPasswordExpire > Date.now();
};

module.exports = mongoose.model('User', UserSchema);