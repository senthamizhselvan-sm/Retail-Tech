const express = require('express');
const router = express.Router();
const { generateImage, editImage, generateText } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { generateValidation, validate } = require('../middleware/validator');

router.post('/generate', protect, generateValidation, validate, generateImage);
router.post('/edit', protect, editImage);
router.post('/generate-text', protect, generateText);

module.exports = router;
