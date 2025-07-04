// routes/registrationStatusRoutes.js
const express = require('express');
const router = express.Router();
const {
  getRegistrationStatuses,
  updateRegistrationStatus,
  getPublicRegistrationStatus
} = require('../controllers/registrationStatusController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/', protect, authorize('admin'), getRegistrationStatuses);
router.put('/:city', protect, authorize('admin'), updateRegistrationStatus);
router.get('/public', getPublicRegistrationStatus);

module.exports = router;