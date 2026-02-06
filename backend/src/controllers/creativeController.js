const posterDesignService = require('../services/posterDesignService');
const BusinessProfile = require('../models/BusinessProfile');
const AILog = require('../models/AILog');

const buildBrandColors = (businessProfile, requestColors = []) => {
  if (Array.isArray(requestColors) && requestColors.length > 0) {
    return requestColors.filter(Boolean);
  }
  if (businessProfile?.themeColor) {
    return [businessProfile.themeColor, '#10B981'];
  }
  return [];
};

// @desc    Generate poster design specs for Fabric.js rendering
// @route   POST /api/creative/poster/design
// @access  Private
exports.generatePosterDesign = async (req, res) => {
  try {
    const {
      product,
      discount,
      festival,
      language = 'english',
      generateVariants = true,
      productImage,
      brandColors
    } = req.body;

    if (!product || discount === undefined || discount === null || !festival) {
      return res.status(400).json({
        success: false,
        message: 'Product, discount, and festival are required'
      });
    }

    const businessProfile = await BusinessProfile.findOne({ userId: req.user._id });
    const resolvedBrandColors = buildBrandColors(businessProfile, brandColors);

    let designs;

    if (generateVariants) {
      designs = await posterDesignService.generateThreeVariants({
        product,
        discount,
        festival,
        brandColors: resolvedBrandColors,
        language
      });
    } else {
      const design = await posterDesignService.generatePosterDesign({
        product,
        discount,
        festival,
        brandColors: resolvedBrandColors,
        language,
        style: req.body.style || 'modern'
      });
      designs = [{ style: 'custom', design }];
    }

    const prompt = `${festival} sale poster for ${product} with ${discount}% off`;

    await AILog.create({
      user: req.user._id,
      action: 'generate',
      prompt,
      apiUsed: 'gemini',
      success: true,
      metadata: {
        style: generateVariants ? 'variants' : (req.body.style || 'modern'),
        size: '1080x1080',
        outputCount: designs.length
      }
    });

    res.json({
      success: true,
      designs,
      productImage,
      metadata: {
        brandColorsUsed: resolvedBrandColors.length > 0,
        language,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Poster design generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate poster design',
      error: error.message
    });
  }
};
