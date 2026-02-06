const SalesReflection = require('../models/SalesReflection');
const BusinessProfile = require('../models/BusinessProfile');
const GrowthEngine = require('../services/growthEngine');

// @desc    Add daily sales reflection
// @route   POST /api/reflection
// @access  Private
exports.addReflection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { salesRating, notes = '', factors = [] } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    // Validate sales rating
    if (!salesRating || salesRating < 1 || salesRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Sales rating must be between 1 and 5'
      });
    }
    
    // Check if reflection already exists for today
    let reflection = await SalesReflection.findOne({ userId, date: today });
    
    // Determine sales level and mood
    const salesLevel = this.getSalesLevel(salesRating);
    const mood = this.getMood(salesRating);
    
    // Generate AI suggestion
    const aiSuggestion = this.generateAISuggestion(salesRating, notes, factors);
    
    // Filter valid factors
    const validFactors = ['weather', 'festival', 'competition', 'stock', 'timing', 'other'];
    const filteredFactors = factors.filter(f => validFactors.includes(f));
    
    if (reflection) {
      // Update existing reflection
      reflection.salesRating = salesRating;
      reflection.salesLevel = salesLevel;
      reflection.notes = notes;
      reflection.factors = filteredFactors;
      reflection.mood = mood;
      reflection.aiSuggestion = aiSuggestion;
    } else {
      // Create new reflection
      reflection = new SalesReflection({
        userId,
        date: today,
        salesRating,
        salesLevel,
        notes,
        factors: filteredFactors,
        mood,
        aiSuggestion
      });
    }
    
    await reflection.save();
    
    // Record action for growth tracking
    await GrowthEngine.recordAction(userId, 'sales_reflection');
    
    res.json({
      success: true,
      message: 'Sales reflection saved successfully',
      reflection
    });
    
  } catch (error) {
    console.error('Add reflection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save sales reflection',
      error: error.message
    });
  }
};

// @desc    Get sales reflections
// @route   GET /api/reflection
// @access  Private
exports.getReflections = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const reflections = await SalesReflection.find({
      userId,
      createdAt: { $gte: startDate }
    }).sort({ date: -1 });
    
    res.json({
      success: true,
      reflections
    });
    
  } catch (error) {
    console.error('Get reflections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reflections',
      error: error.message
    });
  }
};

// @desc    Get weekly trend
// @route   GET /api/reflection/trend
// @access  Private
exports.getWeeklyTrend = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const reflections = await SalesReflection.find({
      userId,
      createdAt: { $gte: weekAgo }
    }).sort({ date: 1 });
    
    // Calculate trend
    const trend = this.calculateTrend(reflections);
    
    res.json({
      success: true,
      trend,
      reflections: reflections.length
    });
    
  } catch (error) {
    console.error('Get trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate trend',
      error: error.message
    });
  }
};

// @desc    Get improvement tip
// @route   GET /api/reflection/tip
// @access  Private
exports.getImprovementTip = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get recent reflections
    const recentReflections = await SalesReflection.find({ userId })
      .sort({ date: -1 })
      .limit(3);
    
    // Get business profile for context
    const profile = await BusinessProfile.findOne({ userId });
    
    // Generate contextual tip
    const tip = this.generateImprovementTip(recentReflections, profile);
    
    res.json({
      success: true,
      tip
    });
    
  } catch (error) {
    console.error('Get tip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate tip',
      error: error.message
    });
  }
};

// Helper Methods
exports.getSalesLevel = (rating) => {
  if (rating <= 2) return 'low';
  if (rating <= 3) return 'medium';
  return 'high';
};

exports.getMood = (rating) => {
  if (rating <= 2) return 'concerned';
  if (rating <= 3) return 'neutral';
  if (rating <= 4) return 'satisfied';
  return 'excited';
};

exports.generateAISuggestion = (rating, notes, factors) => {
  const suggestions = {
    1: [
      'Focus on customer service - greet every customer warmly',
      'Check if your prices are competitive with nearby shops',
      'Ensure your shop is clean and well-organized'
    ],
    2: [
      'Try displaying popular items at eye level',
      'Ask customers what they need - be proactive',
      'Consider small discounts on slow-moving items'
    ],
    3: [
      'Maintain consistency in service quality',
      'Keep track of what sells well and stock more',
      'Build relationships with regular customers'
    ],
    4: [
      'Great job! Keep doing what works',
      'Consider expanding successful product lines',
      'Share your success approach with other days'
    ],
    5: [
      'Excellent! Analyze what made today special',
      'Document your successful strategies',
      'Consider if this approach can work daily'
    ]
  };
  
  const baseSuggestions = suggestions[rating] || suggestions[3];
  return baseSuggestions[Math.floor(Math.random() * baseSuggestions.length)];
};

exports.calculateTrend = (reflections) => {
  if (reflections.length < 2) {
    return { direction: 'stable', message: 'Need more data for trend analysis' };
  }
  
  const ratings = reflections.map(r => r.salesRating);
  const recent = ratings.slice(-3);
  const older = ratings.slice(0, -3);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
  
  if (recentAvg > olderAvg + 0.5) {
    return { direction: 'improving', message: 'Your sales are trending upward!' };
  } else if (recentAvg < olderAvg - 0.5) {
    return { direction: 'declining', message: 'Focus on what worked before' };
  } else {
    return { direction: 'stable', message: 'Consistent performance' };
  }
};

exports.generateImprovementTip = (reflections, profile) => {
  const tips = [
    'Try greeting customers in their preferred language',
    'Keep your best-selling items at eye level',
    'Maintain consistent opening hours',
    'Ask customers about their needs proactively',
    'Keep your shop clean and well-lit',
    'Build relationships with regular customers',
    'Stock items based on local festivals and events',
    'Offer small samples of new products',
    'Display prices clearly to build trust',
    'Keep change ready for smooth transactions'
  ];
  
  // Add business-specific tips
  if (profile?.businessType === 'grocery') {
    tips.push('Keep fruits and vegetables fresh and visible');
    tips.push('Organize items by categories for easy shopping');
  } else if (profile?.businessType === 'clothing') {
    tips.push('Display new arrivals prominently');
    tips.push('Keep different sizes organized and accessible');
  }
  
  return tips[Math.floor(Math.random() * tips.length)];
};
