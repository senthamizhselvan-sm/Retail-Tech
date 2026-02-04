const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');
const { protect } = require('../middleware/auth');

// All routes protected
router.use(protect);

router.post('/generate-reply', communicationController.generateAIReply);
router.get('/inventory-summary', communicationController.getInventorySummary);
router.post('/voice-query', communicationController.processVoiceQuery);
router.get('/history', communicationController.getConversationHistory);
router.post('/save-conversation', communicationController.saveConversation);
router.post('/suggestions', communicationController.getSmartSuggestions);

module.exports = router;
