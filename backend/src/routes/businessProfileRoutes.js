const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const businessProfileController = require('../controllers/businessProfileController');

// All routes are protected
router.use(protect);

// @route   GET /api/business-profile
// @desc    Get business profile
// @access  Private
router.get('/', businessProfileController.getProfile);

// @route   PUT /api/business-profile
// @desc    Update business profile
// @access  Private
router.put('/', businessProfileController.updateProfile);

// @route   POST /api/business-profile/upload-logo
// @desc    Upload shop logo
// @access  Private
router.post('/upload-logo', businessProfileController.uploadLogo);

// @route   POST /api/business-profile/upload-shop-photo
// @desc    Upload shop photo
// @access  Private
router.post('/upload-shop-photo', businessProfileController.uploadShopPhoto);

// @route   DELETE /api/business-profile/logo
// @desc    Remove shop logo
// @access  Private
router.delete('/logo', businessProfileController.removeLogo);

// @route   DELETE /api/business-profile/shop-photo
// @desc    Remove shop photo
// @access  Private
router.delete('/shop-photo', businessProfileController.removeShopPhoto);

module.exports = router;