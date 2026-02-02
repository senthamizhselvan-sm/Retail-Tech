const DailyInsight = require('../models/DailyInsight');
const BusinessProfile = require('../models/BusinessProfile');
const InsightEngine = require('../services/insightEngine');
const GrowthEngine = require('../services/growthEngine');
const GeminiDailyAdvice = require('../services/geminiDailyAdvice');

// @desc    Get today's insights and advice
// @route   GET /api/assistant/today
// @access  Private
exports.getTodayInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if insights already exist for today
    let todayInsights = await DailyInsight.find({ userId, date: today });
    
    // If no insights exist, generate them
    if (todayInsights.length === 0) {
      const generatedInsights = await InsightEngine.generateDailyInsights(userId, today);
      
      // Save generated insights to database
      if (generatedInsights.length > 0) {
        todayInsights = await DailyInsight.insertMany(generatedInsights);
        
        // Record first insight action for growth tracking
        await GrowthEngine.recordAction(userId, 'first_insight');
      }
    }
    
    // Get business profile for personalization
    const profile = await BusinessProfile.findOne({ userId });
    
    // Categorize insights
    const categorizedInsights = {
      stock: todayInsights.filter(i => i.category === 'stock'),
      visibility: todayInsights.filter(i => i.category === 'visibility'),
      psychology: todayInsights.filter(i => i.category === 'psychology'),
      timing: todayInsights.filter(i => i.category === 'timing')
    };
    
    res.json({
      success: true,
      data: {
        date: today,
        profile: {
          shopName: profile?.shopName || 'Your Shop',
          vendorType: profile?.vendorType || 'kirana',
          preferredLanguage: profile?.preferredLanguage || 'en'
        },
        insights: categorizedInsights,
        totalInsights: todayInsights.length
      }
    });
    
  } catch (error) {
    console.error('Today insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today\'s insights',
      error: error.message
    });
  }
};

// @desc    Get insights by category
// @route   GET /api/assistant/category/:category
// @access  Private
exports.getInsightsByCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    const validCategories = ['stock', 'visibility', 'psychology', 'timing'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }
    
    const skip = (page - 1) * limit;
    
    const insights = await DailyInsight.find({ userId, category })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await DailyInsight.countDocuments({ userId, category });
    
    res.json({
      success: true,
      data: {
        insights,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Category insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category insights',
      error: error.message
    });
  }
};

// @desc    Mark insight as read
// @route   PUT /api/assistant/insight/:id/read
// @access  Private
exports.markInsightAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const insight = await DailyInsight.findOne({ _id: id, userId });
    
    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }
    
    insight.isRead = true;
    await insight.save();
    
    res.json({
      success: true,
      message: 'Insight marked as read',
      insight
    });
    
  } catch (error) {
    console.error('Mark insight read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark insight as read',
      error: error.message
    });
  }
};

// @desc    Get insight history
// @route   GET /api/assistant/history
// @access  Private
exports.getInsightHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 7, category } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const query = {
      userId,
      date: { $gte: startDateStr }
    };
    
    if (category) {
      query.category = category;
    }
    
    const insights = await DailyInsight.find(query)
      .sort({ date: -1, createdAt: -1 });
    
    // Group by date
    const groupedInsights = insights.reduce((acc, insight) => {
      if (!acc[insight.date]) {
        acc[insight.date] = [];
      }
      acc[insight.date].push(insight);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        insights: groupedInsights,
        totalDays: Object.keys(groupedInsights).length,
        totalInsights: insights.length
      }
    });
    
  } catch (error) {
    console.error('Insight history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get insight history',
      error: error.message
    });
  }
};

// @desc    Generate fresh insights for today
// @route   POST /api/assistant/refresh
// @access  Private
exports.refreshTodayInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Delete existing insights for today
    await DailyInsight.deleteMany({ userId, date: today });
    
    // Generate fresh insights
    const generatedInsights = await InsightEngine.generateDailyInsights(userId, today);
    
    let todayInsights = [];
    if (generatedInsights.length > 0) {
      todayInsights = await DailyInsight.insertMany(generatedInsights);
    }
    
    res.json({
      success: true,
      message: 'Insights refreshed successfully',
      data: {
        insights: todayInsights,
        count: todayInsights.length
      }
    });
    
  } catch (error) {
    console.error('Refresh insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh insights',
      error: error.message
    });
  }
};

// @desc    Get daily business advice
// @route   GET /api/daily/advice
// @access  Private
exports.getDailyAdvice = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await BusinessProfile.findOne({ userId });
    
    // Generate contextual advice based on business type and day
    const advice = await InsightEngine.generateDailyAdvice(userId, profile);
    
    res.json({
      success: true,
      advice
    });
    
  } catch (error) {
    console.error('Daily advice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily advice',
      error: error.message
    });
  }
};

// @desc    Get daily insights
// @route   GET /api/daily/insights
// @access  Private
exports.getDailyInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    let insights = await DailyInsight.find({ userId, date: today });
    
    if (insights.length === 0) {
      const generatedInsights = await InsightEngine.generateDailyInsights(userId, today);
      if (generatedInsights.length > 0) {
        insights = await DailyInsight.insertMany(generatedInsights);
      }
    }
    
    res.json({
      success: true,
      insights
    });
    
  } catch (error) {
    console.error('Daily insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily insights',
      error: error.message
    });
  }
};

// @desc    Create daily insight
// @route   POST /api/daily/insights
// @access  Private
exports.createInsight = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, content, category } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    // Validate required fields
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }
    
    const insight = new DailyInsight({
      userId,
      date: today,
      insightText: content,
      insightType: type || 'general',
      category: category || 'stock'
    });
    
    await insight.save();
    
    res.json({
      success: true,
      message: 'Insight created successfully',
      insight
    });
    
  } catch (error) {
    console.error('Create insight error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create insight',
      error: error.message
    });
  }
};

// @desc    Get contextual tips
// @route   GET /api/daily/tips
// @access  Private
exports.getContextualTips = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await BusinessProfile.findOne({ userId });
    
    // Generate contextual tips
    const tips = await InsightEngine.generateContextualTips(userId, profile);
    
    res.json({
      success: true,
      tips
    });
    
  } catch (error) {
    console.error('Contextual tips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contextual tips',
      error: error.message
    });
  }
};

// @desc    Get Gemini-powered real-time advice
// @route   GET /api/assistant/gemini/advice
// @access  Private
exports.getGeminiAdvice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category = 'all' } = req.query;

    console.log(`Generating Gemini advice for user ${userId}, category: ${category}`);

    const adviceResult = await GeminiDailyAdvice.generateRealTimeAdvice(userId, category);

    res.json({
      success: true,
      data: adviceResult,
      message: 'Real-time advice generated successfully'
    });

  } catch (error) {
    console.error('Gemini advice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI advice',
      error: error.message
    });
  }
};

// @desc    Get market trend advice
// @route   GET /api/assistant/gemini/trends
// @access  Private
exports.getMarketTrends = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`Generating market trends for user ${userId}`);

    const trendsResult = await GeminiDailyAdvice.generateMarketTrendAdvice(userId);

    res.json({
      success: true,
      data: trendsResult,
      message: 'Market trends generated successfully'
    });

  } catch (error) {
    console.error('Market trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate market trends',
      error: error.message
    });
  }
};

// @desc    Get comprehensive daily insights with AI
// @route   GET /api/assistant/gemini/comprehensive
// @access  Private
exports.getComprehensiveInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`Generating comprehensive insights for user ${userId}`);

    // Get multiple types of advice in parallel
    const [adviceResult, trendsResult] = await Promise.all([
      GeminiDailyAdvice.generateRealTimeAdvice(userId, 'all'),
      GeminiDailyAdvice.generateMarketTrendAdvice(userId)
    ]);

    // Get business profile for additional context
    const profile = await BusinessProfile.findOne({ userId });

    res.json({
      success: true,
      data: {
        advice: adviceResult,
        trends: trendsResult,
        profile: {
          shopName: profile?.shopName || 'Your Shop',
          vendorType: profile?.vendorType || 'retail',
          location: profile?.location || 'local area'
        },
        generatedAt: new Date()
      },
      message: 'Comprehensive insights generated successfully'
    });

  } catch (error) {
    console.error('Comprehensive insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate comprehensive insights',
      error: error.message
    });
  }
};