const BusinessProfile = require('../models/BusinessProfile');
const cloudinary = require('../config/cloudinary');

// @desc    Get business profile
// @route   GET /api/business/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let profile = await BusinessProfile.findOne({ userId });
    if (!profile) {
      // Create default profile
      profile = new BusinessProfile({
        userId,
        shopName: req.user.name + "'s Shop",
        vendorType: 'kirana'
      });
      await profile.save();
    }
    
    res.json({
      success: true,
      profile
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// @desc    Update business profile
// @route   PUT /api/business/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;
    
    let profile = await BusinessProfile.findOne({ userId });
    
    if (!profile) {
      profile = new BusinessProfile({ userId, ...profileData });
    } else {
      // Update all provided fields
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== undefined) {
          if (key === 'address' || key === 'operatingDays' || key === 'businessHours') {
            // For nested objects, merge the properties
            profile[key] = { ...profile[key], ...profileData[key] };
          } else if (key === 'establishedYear') {
            // Handle establishedYear specially to avoid validation issues
            if (profileData[key] === null || profileData[key] === '') {
              profile[key] = undefined;
            } else {
              profile[key] = profileData[key];
            }
          } else {
            profile[key] = profileData[key];
          }
        }
      });
    }
    
    await profile.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// @desc    Upload shop logo
// @route   POST /api/business/upload-logo
// @access  Private
exports.uploadLogo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageData } = req.body; // Base64 image data
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }
    
    // Upload to Cloudinary
    const uploadOptions = {
      folder: 'shop_logos',
      public_id: `logo_${userId}`,
      overwrite: true,
      transformation: [
        { width: 200, height: 200, crop: 'fit' },
        { quality: 'auto' }
      ]
    };
    
    const result = await cloudinary.uploader.upload(imageData, uploadOptions);
    
    // Update profile with new logo URL
    await BusinessProfile.findOneAndUpdate(
      { userId },
      { logoUrl: result.secure_url },
      { upsert: true }
    );
    
    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logoUrl: result.secure_url
    });
    
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo',
      error: error.message
    });
  }
};

// @desc    Upload shop photo
// @route   POST /api/business/upload-shop-photo
// @access  Private
exports.uploadShopPhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageData } = req.body; // Base64 image data
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }
    
    // Upload to Cloudinary
    const uploadOptions = {
      folder: 'shop_photos',
      public_id: `shop_${userId}`,
      overwrite: true,
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' }
      ]
    };
    
    const result = await cloudinary.uploader.upload(imageData, uploadOptions);
    
    // Update profile with new shop photo URL
    await BusinessProfile.findOneAndUpdate(
      { userId },
      { shopPhotoUrl: result.secure_url },
      { upsert: true }
    );
    
    res.json({
      success: true,
      message: 'Shop photo uploaded successfully',
      shopPhotoUrl: result.secure_url
    });
    
  } catch (error) {
    console.error('Shop photo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload shop photo',
      error: error.message
    });
  }
};

// @desc    Remove shop logo
// @route   DELETE /api/business/logo
// @access  Private
exports.removeLogo = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Remove from profile
    await BusinessProfile.findOneAndUpdate(
      { userId },
      { logoUrl: '' }
    );
    
    // Optionally delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(`shop_logos/logo_${userId}`);
    } catch (cloudinaryError) {
      console.warn('Cloudinary deletion warning:', cloudinaryError.message);
    }
    
    res.json({
      success: true,
      message: 'Logo removed successfully'
    });
    
  } catch (error) {
    console.error('Remove logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove logo',
      error: error.message
    });
  }
};

// @desc    Remove shop photo
// @route   DELETE /api/business/shop-photo
// @access  Private
exports.removeShopPhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Remove from profile
    await BusinessProfile.findOneAndUpdate(
      { userId },
      { shopPhotoUrl: '' }
    );
    
    // Optionally delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(`shop_photos/shop_${userId}`);
    } catch (cloudinaryError) {
      console.warn('Cloudinary deletion warning:', cloudinaryError.message);
    }
    
    res.json({
      success: true,
      message: 'Shop photo removed successfully'
    });
    
  } catch (error) {
    console.error('Remove shop photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove shop photo',
      error: error.message
    });
  }
};
