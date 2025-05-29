const express = require('express');
const {
  register,
  login,
  adminLogin, 
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  verifyResetCode,
  resetPassword
} = require('../controllers/authController');

const router = express.Router();

const { protect } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin); 
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.post('/forgotpassword', forgotPassword);
router.post('/verifycode', verifyResetCode); 
router.put('/resetpassword', resetPassword); 

module.exports = router;