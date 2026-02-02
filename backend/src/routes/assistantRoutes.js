const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { chatWithAssistant } = require('../controllers/assistantController');

// @route   POST /api/assistant/chat
// @desc    Chat with personal AI assistant
// @access  Private
router.post('/chat', protect, chatWithAssistant);

module.exports = router;