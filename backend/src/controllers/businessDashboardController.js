const BusinessProfile = require('../models/BusinessProfile');
const DailyInsight = require('../models/DailyInsight');
const SalesReflection = require('../models/SalesReflection');
const CompetitorPrice = require('../models/CompetitorPrice');
const GrowthProgress = require('../models/GrowthProgress');

// @desc    Get business dashboard data
// @route   GET /api/business/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Get or create business profile
    let profile = await BusinessProfile.findOne({ userId });
    if (!profile) {
      profile = new BusinessProfile({
        userId,
        shopName: req.user.name + "'s Shop",
        vendorType: 'kirana',
        preferredLanguage: 'en'
      });
      await profile.save();
    }
    
    // Get today's insights
    const todayInsights = await DailyInsight.find({ userId, date: today }).limit(3);
    
    // Get recent sales reflection
    const recentReflection = await SalesReflection.findOne({ userId })
      .sort({ createdAt: -1 });
    
    // Get competitor price summary
    const competitorPrices = await CompetitorPrice.find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Calculate business health indicators
    const healthIndicators = await this.calculateHealthIndicators(userId);
    
    // Get growth progress
    const growthProgress = await GrowthProgress.findOne({ userId });
    
    res.json({
      success: true,
      dashboard: {
        profile,
        healthIndicators,
        todayInsights,
        recentReflection,
        competitorPrices,
        growthProgress: {
          stage: growthProgress?.stage || 'starter',
          totalScore: growthProgress?.totalScore || 0,
          badges: growthProgress?.badges || []
        }
      }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard',
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
    const { shopName, vendorType, preferredLanguage, themeColor, logoUrl, address, phoneNumber } = req.body;
    
    let profile = await BusinessProfile.findOne({ userId });
    
    if (!profile) {
      profile = new BusinessProfile({ userId });
    }
    
    // Update fields if provided
    if (shopName) profile.shopName = shopName;
    if (vendorType) profile.vendorType = vendorType;
    if (preferredLanguage) profile.preferredLanguage = preferredLanguage;
    if (themeColor) profile.themeColor = themeColor;
    if (logoUrl !== undefined) profile.logoUrl = logoUrl;
    if (address !== undefined) profile.address = address;
    if (phoneNumber !== undefined) profile.phoneNumber = phoneNumber;
    
    await profile.save();
    
    res.json({
      success: true,
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

// @desc    Get business health status
// @route   GET /api/business/health
// @access  Private
exports.getBusinessHealth = async (req, res) => {
  try {
    const userId = req.user.id;
    const healthIndicators = await this.calculateHealthIndicators(userId);
    
    res.json({
      success: true,
      health: healthIndicators
    });
    
  } catch (error) {
    console.error('Business health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get business health',
      error: error.message
    });
  }
};

// @desc    Get voice summary
// @route   GET /api/business/summary
// @access  Private
exports.getVoiceSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const healthIndicators = await this.calculateHealthIndicators(userId);
    
    // Generate voice summary based on health
    let summary = '';
    if (healthIndicators.businessHealth === 'high') {
      summary = 'Today business looks excellent. Sales are trending up and your prices are competitive.';
    } else if (healthIndicators.businessHealth === 'low') {
      summary = 'Today business needs attention. Consider reviewing your pricing and customer approach.';
    } else {
      summary = 'Today business looks normal. Keep maintaining your current approach.';
    }
    
    res.json({
      success: true,
      summary: {
        text: summary,
        health: healthIndicators.businessHealth,
        trend: healthIndicators.salesTrend
      }
    });
    
  } catch (error) {
    console.error('Voice summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate summary',
      error: error.message
    });
  }
};

// @desc    Get business profile
// @route   GET /api/business/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let profile = await BusinessProfile.findOne({ userId });
    if (!profile) {
      profile = new BusinessProfile({
        userId,
        shopName: req.user.name + "'s Shop",
        vendorType: 'kirana',
        preferredLanguage: 'en'
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

// Helper function to calculate business health indicators
exports.calculateHealthIndicators = async (userId) => {
  try {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Sales trend from reflections
    const recentReflections = await SalesReflection.find({
      userId,
      date: { $gte: lastWeekStr, $lte: today }
    }).sort({ date: -1 });
    
    let salesTrend = 'stable';
    if (recentReflections.length >= 2) {
      const latest = recentReflections[0];
      const previous = recentReflections[1];
      if (latest.salesRating > previous.salesRating) {
        salesTrend = 'up';
      } else if (latest.salesRating < previous.salesRating) {
        salesTrend = 'down';
      }
    }
    
    // Price competitiveness
    const competitorPrices = await CompetitorPrice.find({ userId, isActive: true });
    let priceStatus = 'competitive';
    if (competitorPrices.length > 0) {
      const lowerCount = competitorPrices.filter(p => p.comparisonResult === 'lower').length;
      const higherCount = competitorPrices.filter(p => p.comparisonResult === 'higher').length;
      
      if (lowerCount > higherCount) {
        priceStatus = 'competitive';
      } else if (higherCount > lowerCount) {
        priceStatus = 'premium';
      } else {
        priceStatus = 'mixed';
      }
    }
    
    // Overall business health
    let businessHealth = 'normal';
    if (salesTrend === 'up' && priceStatus === 'competitive') {
      businessHealth = 'high';
    } else if (salesTrend === 'down' || priceStatus === 'premium') {
      businessHealth = 'low';
    }
    
    return {
      businessHealth,
      salesTrend,
      priceStatus,
      offerFreshness: 'fresh', // Simplified for now
      lastUpdated: new Date()
    };
    
  } catch (error) {
    console.error('Error calculating health indicators:', error);
    return {
      businessHealth: 'normal',
      salesTrend: 'stable',
      priceStatus: 'competitive',
      offerFreshness: 'fresh',
      lastUpdated: new Date()
    };
  }
};
