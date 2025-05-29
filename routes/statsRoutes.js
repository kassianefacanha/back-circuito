const express = require('express');
const { getStats, getStatsByCity } = require('../controllers/statsController');

const router = express.Router();

router.get('/', getStats);
router.get('/:city', getStatsByCity);

module.exports = router;