const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const growthController = require('../controllers/growthController');

// All routes are protected
router.use(protect);

// @route   GET /api/growth
// @desc    Get vendor growth status
// @access  Private
router.get('/', growthController.getGrowthStatus);

// @route   GET /api/growth/badges
// @desc    Get available badges
// @access  Private
router.get('/badges', growthController.getAvailableBadges);

// @route   GET /api/growth/insights
// @desc    Get growth insights
// @access  Private
router.get('/insights', growthController.getGrowthInsights);

// @route   POST /api/growth/achievement
// @desc    Record manual achievement
// @access  Private
router.post('/achievement', growthController.recordAchievement);

module.exports = router;
