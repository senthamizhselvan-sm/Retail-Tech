const express = require('express');
const { orchestrateAI } = require('../controllers/aiOrchestratorController');
const { enhancedOrchestrateAI } = require('../controllers/enhancedOrchestratorController');

const router = express.Router();

// @desc    AI Orchestrator - Process natural language requests
// @route   POST /api/orchestrator/process
// @access  Public (for testing)
router.post('/process', orchestrateAI);

// @desc    Enhanced AI Orchestrator - 4-step process with Gemini pre-processing
// @route   POST /api/orchestrator/enhanced
// @access  Public (for testing)
router.post('/enhanced', enhancedOrchestrateAI);

module.exports = router;
