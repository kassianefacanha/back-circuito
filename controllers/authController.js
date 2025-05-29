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

    // Gerar código de 6 dígitos
    const resetCode = user.generateResetPasswordCode();
    await user.save({ validateBeforeSave: false });

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
    const user = await User.findOne({ 
        email: req.body.email,
        resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordCode');

    if (!user) {
        return next(new ErrorResponse('Código expirado ou email inválido', 400));
    }
console.log(req.body.code)
    // Verificar se o código está correto
    const isValid = user.isValidResetCode(req.body.code);

    if (!isValid) {
        return next(new ErrorResponse('Código inválido', 400));
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
    const user = await User.findOne({ 
        email: req.body.email,
        resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordCode');

    if (!user) {
        return next(new ErrorResponse('Código expirado ou email inválido', 400));
    }

    // Verificar se o código está correto
    const isValid = user.isValidResetCode(req.body.code);

    if (!isValid) {
        return next(new ErrorResponse('Código inválido', 400));
    }

    // Verificar se as senhas coincidem
    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorResponse('As senhas não coincidem', 400));
    }

    // Atualizar a senha
    user.password = req.body.password;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Enviar resposta com token
    sendTokenResponse(user, 200, res);
});
// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, phone, gender, password, confirmPassword, city } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    confirmPassword,
  });

  sendTokenResponse(user, 200, res);
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
    return next(new ErrorResponse('Credenciais inválidas', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Credenciais inválidas', 401));
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


// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Token inválido ou expirado', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
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