const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const businessDashboardController = require('../controllers/businessDashboardController');

// All routes are protected
router.use(protect);

// @route   GET /api/business/dashboard
// @desc    Get business dashboard data
// @access  Private
router.get('/dashboard', businessDashboardController.getDashboard);

// @route   GET /api/business/health
// @desc    Get business health status
// @access  Private
router.get('/health', businessDashboardController.getBusinessHealth);

// @route   GET /api/business/summary
// @desc    Get voice summary
// @access  Private
router.get('/summary', businessDashboardController.getVoiceSummary);

// @route   POST /api/business/profile
// @desc    Create or update business profile
// @access  Private
router.post('/profile', businessDashboardController.updateProfile);

// @route   GET /api/business/profile
// @desc    Get business profile
// @access  Private
router.get('/profile', businessDashboardController.getProfile);

module.exports = router;
