const express = require('express');
const router = express.Router();
const creativeController = require('../controllers/creativeController');
const { protect } = require('../middleware/auth');

router.post('/poster/design', protect, creativeController.generatePosterDesign);

module.exports = router;
