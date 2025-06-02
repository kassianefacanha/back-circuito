const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Get all users (non-admin only)
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  // Filtrar apenas usuários não administradores
  const users = await User.find({ role: { $ne: 'admin' } })
                         .select('-password -resetPasswordCode -resetPasswordExpire');
  
  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
                         .select('-password -resetPasswordCode -resetPasswordExpire');

  if (!user) {
    return next(
      new ErrorResponse(`Usuário não encontrado com o id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Create user
// @route   POST /api/v1/users
// @access  Public
exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  // Validação básica
  if (!name || !email || !password || !phone) {
    return next(new ErrorResponse('Por favor, preencha todos os campos', 400));
  }

  // Verificar se usuário já existe
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email já cadastrado', 400));
  }

  // Criar usuário
  const user = await User.create({
    name,
    email,
    password,
    phone
  });

  // Gerar token JWT
  const token = user.getSignedJwtToken();

  // Retornar resposta com token
  res.status(201).json({
    success: true,
    token,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
});
// @desc    Get current logged in user
// @route   GET /api/v1/users/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // O usuário já está disponível no req.user graças ao middleware de autenticação
  const user = await User.findById(req.user.id)
                         .select('-password -resetPasswordCode -resetPasswordExpire');

  if (!user) {
    return next(
      new ErrorResponse(`Usuário não encontrado`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
});
// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone
  };

  // Se for admin e quiser atualizar o role
  if (req.user.role === 'admin' && req.body.role) {
    fieldsToUpdate.role = req.body.role;
  }

  const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  }).select('-password -resetPasswordCode -resetPasswordExpire');

  if (!user) {
    return next(
      new ErrorResponse(`Usuário não encontrado com o id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`Usuário não encontrado com o id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Forgot password - Generate reset code
// @route   POST /api/v1/users/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('Não há usuário com esse email', 404));
  }

  // Gerar código de reset
  const resetCode = user.generateResetPasswordCode();
  await user.save({ validateBeforeSave: false });

  // Criar mensagem de email
  const message = `Seu código para redefinir senha é: ${resetCode}\n\nSe você não solicitou este código, por favor ignore este email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Código de redefinição de senha',
      message
    });

    res.status(200).json({
      success: true,
      data: 'Email com código de redefinição enviado'
    });
  } catch (err) {
    console.error(err);
    user.resetPasswordCode = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email não pôde ser enviado', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/v1/users/resetpassword/:resetcode
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Hash do código recebido
  const resetPasswordCode = crypto
    .createHash('sha256')
    .update(req.params.resetcode)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordCode,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Código inválido ou expirado', 400));
  }

  // Definir nova senha
  user.password = req.body.password;
  user.resetPasswordCode = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Gerar token JWT
  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});