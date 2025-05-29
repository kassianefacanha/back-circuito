const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./async');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Não autorizado', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return next(new ErrorResponse('Não autorizado', 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Usuário com role ${req.user.role} não está autorizado a acessar essa rota`,
          403
        )
      );
    }
    next();
  };

exports.isAdmin = asyncHandler(async (req, res, next) => {
  // Verifica se está autenticado
  if (!req.user) {
    return next(new ErrorResponse('Não autorizado', 401));
  }
  
  // Verifica se é admin
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Acesso restrito a administradores', 403));
  }
  
  next();
});
};