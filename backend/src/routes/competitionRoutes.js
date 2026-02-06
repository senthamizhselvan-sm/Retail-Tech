const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const competitionController = require('../controllers/competitionController');

// All routes are protected
router.use(protect);

// @route   POST /api/competition/price
// @desc    Add competitor price
// @access  Private
router.post('/price', competitionController.addCompetitorPrice);

// @route   GET /api/competition/prices
// @desc    Get competitor prices
// @access  Private
router.get('/prices', competitionController.getCompetitorPrices);

// @route   GET /api/competition/comparison
// @desc    Get price comparison
// @access  Private
router.get('/comparison', competitionController.getPriceComparison);

// @route   GET /api/competition/suggestions
// @desc    Get pricing suggestions
// @access  Private
router.get('/suggestions', competitionController.getPricingSuggestions);

// @route   DELETE /api/competition/price/:id
// @desc    Delete competitor price
// @access  Private
router.delete('/price/:id', competitionController.deleteCompetitorPrice);

module.exports = router;
