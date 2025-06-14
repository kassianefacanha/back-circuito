const express = require('express');
const {
  initializeLimits,
  getCategoryLimits,
  getCategoryLimit,
  updateCategoryLimit,
  getCategoryLimitsByCity,
  getCapacityStats
} = require('../controllers/categoryLimits');

const router = express.Router();

const { protect, authorize } = require('../middlewares/auth');

// Rotas públicas
router.get('/city/:city', getCategoryLimitsByCity);
router.get('/stats/:city', getCapacityStats);

// Rotas protegidas (admin)
router.use(protect, authorize('admin'));

router.post('/initialize', initializeLimits);
router.get('/', getCategoryLimits);
router.get('/:id', getCategoryLimit);
router.put('/:id', updateCategoryLimit);

module.exports = router;