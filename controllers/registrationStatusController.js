// controllers/registrationStatusController.js
const RegistrationStatus = require('../models/RegistrationStatus');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');

// @desc    Get all registration statuses
// @route   GET /api/v1/registration-status
// @access  Private (Admin)
exports.getRegistrationStatuses = asyncHandler(async (req, res, next) => {
  const statuses = await RegistrationStatus.find();
  
  // Inicializar se não existir
  if (statuses.length === 0) {
    await RegistrationStatus.insertMany([
      { city: 'Fortaleza', isOpen: true, message: 'Inscrições abertas' },
      { city: 'Aquiraz', isOpen: true, message: 'Inscrições abertas' }
    ]);
    return res.status(200).json({
      success: true,
      data: await RegistrationStatus.find()
    });
  }

  res.status(200).json({
    success: true,
    data: statuses
  });
});

// @desc    Update registration status
// @route   PUT /api/v1/registration-status/:city
// @access  Private (Admin)
exports.updateRegistrationStatus = asyncHandler(async (req, res, next) => {
  const { isOpen, message } = req.body;
  const city = req.params.city;

  let status = await RegistrationStatus.findOne({ city });

  if (!status) {
    return next(
      new ErrorResponse(`Status de inscrição não encontrado para a cidade ${city}`, 404)
    );
  }

  if (isOpen !== undefined) status.isOpen = isOpen;
  if (message !== undefined) status.message = message;

  await status.save();

  res.status(200).json({
    success: true,
    data: status
  });
});

// @desc    Get registration status for public
// @route   GET /api/v1/registration-status/public
// @access  Public
exports.getPublicRegistrationStatus = asyncHandler(async (req, res, next) => {
  const statuses = await RegistrationStatus.find();
  
  // Inicializar se não existir
  if (statuses.length === 0) {
    await RegistrationStatus.insertMany([
      { city: 'Fortaleza', isOpen: true, message: 'Inscrições abertas' },
      { city: 'Aquiraz', isOpen: true, message: 'Inscrições abertas' }
    ]);
    return res.status(200).json({
      success: true,
      data: await RegistrationStatus.find()
    });
  }

  res.status(200).json({
    success: true,
    data: statuses
  });
});