const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');


// @desc    Solicitar código de redefinição
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('Não há usuário com esse email', 404));
  }

  // Gera e armazena o código (já retorna o código legível)
  const resetCode = user.generateResetPasswordCode();
  await user.save({ validateBeforeSave: false });

  // Mensagem do email
  const message = `Seu código de redefinição de senha é: ${resetCode}\n\nEste código expira em 10 minutos.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Código de redefinição de senha',
      message,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Redefinição de Senha</h2>
          <p>Seu código de verificação é:</p>
          <h3 style="background: #f4f4f4; padding: 10px; display: inline-block;">
            ${resetCode}
          </h3>
          <p>Este código expira em 10 minutos.</p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      data: 'Código de redefinição enviado por email'
    });
  } catch (err) {
    console.error('Erro no envio de email:', err);

    // Limpa os campos em caso de erro
    user.resetPasswordCode = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('O email não pôde ser enviado. Por favor, tente novamente.', 500));
  }
});
// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  // Se estiver usando cookies:
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});
// @desc    Verificar código de redefinição
// @route   POST /api/v1/auth/verifycode
// @access  Public
exports.verifyResetCode = asyncHandler(async (req, res, next) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return next(new ErrorResponse('Email e código são obrigatórios', 400));
  }

  // Busca usuário incluindo os campos normalmente ocultos
  const user = await User.findOne({
    email: email
  }).select('+resetPasswordCode +resetPasswordExpire');

  if (!user) {
    return next(new ErrorResponse('Email inválido', 400));
  }

  // Verifica se o código é válido
  const isValid = user.isValidResetCode(code);

  if (!isValid) {
    return next(new ErrorResponse('Código inválido ou expirado', 400));
  }

  res.status(200).json({
    success: true,
    data: 'Código válido'
  });
});

// @desc    Redefinir senha com código
// @route   PUT /api/v1/auth/resetpassword
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  console.log('Dados recebidos:', {
    email: req.body.email,
    code: req.body.code,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
  });
  // Extrair dados do corpo da requisição
  const { email, code, password, confirmPassword } = req.body;

  // Verificar campos obrigatórios
  if (!email || !code || !password || !confirmPassword) {
    return next(new ErrorResponse('Todos os campos são obrigatórios', 400));
  }

  // Verificar se as senhas coincidem
  if (password !== confirmPassword) {
    return next(new ErrorResponse('As senhas não coincidem', 400));
  }

  // Buscar usuário incluindo campos de reset
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+resetPasswordCode +resetPasswordExpire');

  if (!user) {
    return next(new ErrorResponse('Usuário não encontrado', 404));
  }

  // Verificar se há código de reset pendente
  if (!user.resetPasswordCode || !user.resetPasswordExpire) {
    return next(new ErrorResponse('Nenhum pedido de reset de senha encontrado', 400));
  }

  // Verificar validade do código
  if (user.resetPasswordCode !== code.toString().trim()) {
    return next(new ErrorResponse('Código de reset inválido', 400));
  }

  if (user.resetPasswordExpire < Date.now()) {
    return next(new ErrorResponse('Código de reset expirado', 400));
  }

  // Atualizar senha
  user.password = password;
  user.confirmPassword = confirmPassword; 
  user.resetPasswordCode = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  // Enviar email de confirmação (opcional)
  try {
    await sendEmail({
      email: user.email,
      subject: 'Senha alterada com sucesso',
      message: 'Sua senha foi redefinida com sucesso.'
    });
  } catch (err) {
    console.error('Erro ao enviar email de confirmação:', err);
    // Não interrompe o fluxo por falha no email
  }

  res.status(200).json({
    success: true,
    data: 'Senha redefinida com sucesso'
  });
});
// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {

  const { name, email, password, phone, confirmPassword } = req.body;

  // Validação básica
  if (!name || !email || !password || !phone || !confirmPassword) {
    res.status(400).json({
      success: false,
      message: "Por favor, preencha todos os campos"
    });
  }

  // Verificar se usuário já existe
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    res.status(400).json({
      success: false,
      message: "Email já cadastrado"
    });
  }

  // Criar usuário
  const user = await User.create({
    name,
    email,
    password,
    confirmPassword,
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

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Por favor, forneça um email e senha', 400));
  }
  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    console.log('Usuário não existe ou Credenciais inválidas')
    res.status(401).json({
      success: false,
      message: 'Usuário não existe ou Credenciais inválidas'
    })
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    console.log('Credenciais inválidas')
    res.status(401).json({
      success: false,
      message: 'Credenciais inválidas'
    });

  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Senha atual incorreta', 401));
  }

  user.password = req.body.newPassword;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});


// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};

// @desc    Login admin
// @route   POST /api/v1/auth/admin-login
// @access  Public
exports.adminLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Por favor, forneça um email e senha', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Credenciais inválidas', 401));
  }

  // Check if user is admin
  if (user.role !== 'admin') {
    return next(new ErrorResponse('Acesso restrito a administradores', 403));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Credenciais inválidas', 401));
  }

  // Create token
  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token,
    role: user.role // Envia o role para o frontend
  });
});