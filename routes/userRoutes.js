const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getMe // 1. Importe o novo controller
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

// Rota para obter dados do usuário logado
router.get('/me', protect, getMe); // 2. Adicione esta nova rota

router
  .route('/')
  .get(protect, authorize('admin'), getUsers)
  .post(createUser);

router
  .route('/:id')
  .get(protect, getUser)
  .put(protect, updateUser)
  .delete(protect, authorize('admin'), deleteUser);

module.exports = router;