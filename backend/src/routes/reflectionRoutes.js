const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const reflectionController = require('../controllers/reflectionController');

// All routes are protected
router.use(protect);

// @route   POST /api/reflection
// @desc    Add daily sales reflection
// @access  Private
router.post('/', reflectionController.addReflection);

// @route   GET /api/reflection
// @desc    Get sales reflections
// @access  Private
router.get('/', reflectionController.getReflections);

// @route   GET /api/reflection/trend
// @desc    Get weekly trend
// @access  Private
router.get('/trend', reflectionController.getWeeklyTrend);

// @route   GET /api/reflection/tip
// @desc    Get improvement tip
// @access  Private
router.get('/tip', reflectionController.getImprovementTip);

module.exports = router;
