const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const dailyAssistantController = require('../controllers/dailyAssistantController');

// All routes are protected
router.use(protect);

// @route   GET /api/daily/advice
// @desc    Get daily business advice
// @access  Private
router.get('/advice', dailyAssistantController.getDailyAdvice);

// @route   GET /api/daily/insights
// @desc    Get daily insights
// @access  Private
router.get('/insights', dailyAssistantController.getDailyInsights);

// @route   POST /api/daily/insights
// @desc    Create daily insight
// @access  Private
router.post('/insights', dailyAssistantController.createInsight);

// @route   GET /api/daily/tips
// @desc    Get contextual tips
// @access  Private
router.get('/tips', dailyAssistantController.getContextualTips);

// New Gemini-powered routes
// @route   GET /api/assistant/gemini/advice
// @desc    Get Gemini-powered real-time advice
// @access  Private
router.get('/gemini/advice', dailyAssistantController.getGeminiAdvice);

// @route   GET /api/assistant/gemini/trends
// @desc    Get market trend advice
// @access  Private
router.get('/gemini/trends', dailyAssistantController.getMarketTrends);

// @route   GET /api/assistant/gemini/comprehensive
// @desc    Get comprehensive daily insights with AI
// @access  Private
router.get('/gemini/comprehensive', dailyAssistantController.getComprehensiveInsights);

module.exports = router;
