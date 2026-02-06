const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const customerIntelController = require('../controllers/customerIntelController');

// All routes are protected
router.use(protect);

// @route   GET /api/customer/templates
// @desc    Get reply templates
// @access  Private
router.get('/templates', customerIntelController.getReplyTemplates);

// @route   POST /api/customer/query
// @desc    Save customer query
// @access  Private
router.post('/query', customerIntelController.saveCustomerQuery);

// @route   GET /api/customer/queries
// @desc    Get customer queries
// @access  Private
router.get('/queries', customerIntelController.getCustomerQueries);

// @route   GET /api/customer/suggestions
// @desc    Get contextual suggestions
// @access  Private
router.get('/suggestions', customerIntelController.getContextualSuggestions);

module.exports = router;
