const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const planningController = require('../controllers/planningController');

// All routes are protected
router.use(protect);

// @route   GET /api/planning/calendar
// @desc    Get planning calendar
// @access  Private
router.get('/calendar', planningController.getPlanningCalendar);

// @route   GET /api/planning/recommendations
// @desc    Get offer recommendations
// @access  Private
router.get('/recommendations', planningController.getOfferRecommendations);

// @route   GET /api/planning/offers
// @desc    Get AI-powered offer recommendations with market analysis
// @access  Private
router.get('/offers', planningController.getOfferRecommendations);

// @route   GET /api/planning/offers/:productId
// @desc    Get single product offer recommendation
// @access  Private
router.get('/offers/:productId', planningController.getProductOfferRecommendation);

// @route   POST /api/planning/predict-discount
// @desc    Predict discount impact using AI
// @access  Private
router.post('/predict-discount', planningController.predictDiscountImpact);

// @route   POST /api/planning/lock
// @desc    Lock a plan for future use
// @access  Private
router.post('/lock', planningController.lockPlan);

// @route   GET /api/planning/locked
// @desc    Get locked plans
// @access  Private
router.get('/locked', planningController.getLockedPlans);

// @route   DELETE /api/planning/locked/:id
// @desc    Delete locked plan
// @access  Private
router.delete('/locked/:id', planningController.deleteLockedPlan);

module.exports = router;