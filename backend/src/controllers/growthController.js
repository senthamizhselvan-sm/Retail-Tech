const GrowthProgress = require('../models/GrowthProgress');
const BusinessProfile = require('../models/BusinessProfile');
const GrowthEngine = require('../services/growthEngine');

// @desc    Get vendor growth status
// @route   GET /api/growth
// @access  Private
exports.getGrowthStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get or create growth progress
    let progress = await GrowthProgress.findOne({ userId });
    if (!progress) {
      progress = await GrowthEngine.initializeProgress(userId);
    }
    
    // Get business profile for context
    const profile = await BusinessProfile.findOne({ userId });
    
    // Calculate current level info based on stage
    const stageInfo = this.getStageInfo(progress.stage);
    const nextStageInfo = this.getNextStageInfo(progress.stage);
    
    res.json({
      success: true,
      progress: {
        stage: progress.stage,
        stageName: stageInfo.name,
        stageDescription: stageInfo.description,
        totalScore: progress.totalScore,
        scoreToNext: nextStageInfo ? nextStageInfo.requiredScore - progress.totalScore : 0,
        badges: progress.badges,
        completedActions: progress.completedActions,
        weeklyGoals: progress.weeklyGoals,
        lastUpdated: progress.lastUpdated
      },
      nextStage: nextStageInfo,
      businessProfile: profile
    });
    
  } catch (error) {
    console.error('Get growth status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch growth status',
      error: error.message
    });
  }
};

// @desc    Get available badges
// @route   GET /api/growth/badges
// @access  Private
exports.getAvailableBadges = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const progress = await GrowthProgress.findOne({ userId });
    const allBadges = this.getAllBadges();
    
    // Mark earned badges - fix the logic to match the model structure
    const badgesWithStatus = allBadges.map(badge => {
      const earnedBadge = progress?.badges?.find(b => b.badgeType === badge.id);
      return {
        ...badge,
        earned: !!earnedBadge,
        earnedDate: earnedBadge?.earnedAt
      };
    });
    
    res.json({
      success: true,
      badges: badgesWithStatus
    });
    
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch badges',
      error: error.message
    });
  }
};

// @desc    Get growth insights
// @route   GET /api/growth/insights
// @access  Private
exports.getGrowthInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const progress = await GrowthProgress.findOne({ userId });
    if (!progress) {
      return res.json({
        success: true,
        insights: {
          message: 'Start using RetailGen AI features to unlock growth insights!',
          suggestions: [
            'Complete your business profile',
            'Add your first sales reflection',
            'Plan your next offer'
          ]
        }
      });
    }
    
    // Generate insights based on usage patterns
    const insights = this.generateGrowthInsights(progress);
    
    res.json({
      success: true,
      insights
    });
    
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error.message
    });
  }
};

// @desc    Record manual achievement
// @route   POST /api/growth/achievement
// @access  Private
exports.recordAchievement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, name, description } = req.body;
    
    if (!type || !name) {
      return res.status(400).json({
        success: false,
        message: 'Achievement type and name are required'
      });
    }
    
    const result = await GrowthEngine.recordAchievement(userId, type, name, description);
    
    res.json({
      success: true,
      message: 'Achievement recorded successfully',
      achievement: result.achievement,
      levelUp: result.levelUp,
      newBadges: result.newBadges
    });
    
  } catch (error) {
    console.error('Record achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record achievement',
      error: error.message
    });
  }
};

// Helper Methods
exports.getStageInfo = (stage) => {
  const stages = {
    starter: { name: 'Starter', description: 'Just getting started', requiredScore: 0 },
    growing: { name: 'Growing', description: 'Building momentum', requiredScore: 30 },
    established: { name: 'Established', description: 'Consistent performer', requiredScore: 60 },
    pro: { name: 'Pro Seller', description: 'Advanced business owner', requiredScore: 80 }
  };
  
  return stages[stage] || stages.starter;
};

exports.getNextStageInfo = (currentStage) => {
  const stageOrder = ['starter', 'growing', 'established', 'pro'];
  const currentIndex = stageOrder.indexOf(currentStage);
  
  if (currentIndex < stageOrder.length - 1) {
    const nextStage = stageOrder[currentIndex + 1];
    return this.getStageInfo(nextStage);
  }
  
  return null; // Already at highest stage
};

exports.getAllBadges = () => {
  return [
    {
      id: 'first_reflection',
      name: 'First Reflection',
      description: 'Added your first sales reflection',
      icon: '📝',
      category: 'learning'
    },
    {
      id: 'consistent_user',
      name: 'Consistent User',
      description: 'Used the platform for 7 consecutive days',
      icon: '🔥',
      category: 'consistency'
    },
    {
      id: 'planner',
      name: 'Strategic Planner',
      description: 'Created your first offer plan',
      icon: '📅',
      category: 'planning'
    },
    {
      id: 'brand_builder',
      name: 'Brand Builder',
      description: 'Completed your brand profile',
      icon: '🏪',
      category: 'branding'
    },
    {
      id: 'competitor_aware',
      name: 'Market Aware',
      description: 'Added competitor price comparison',
      icon: '👁️',
      category: 'intelligence'
    },
    {
      id: 'customer_focused',
      name: 'Customer Focused',
      description: 'Used customer communication tools',
      icon: '💬',
      category: 'communication'
    },
    {
      id: 'growth_minded',
      name: 'Growth Minded',
      description: 'Reached Level 3',
      icon: '📈',
      category: 'achievement'
    },
    {
      id: 'pro_seller',
      name: 'Pro Seller',
      description: 'Reached Level 5',
      icon: '🏆',
      category: 'achievement'
    }
  ];
};

exports.generateGrowthInsights = (progress) => {
  const insights = {
    message: '',
    suggestions: [],
    strengths: [],
    opportunities: []
  };
  
  // Analyze consistency based on completed actions
  const actionCount = progress.completedActions?.length || 0;
  if (actionCount >= 7) {
    insights.strengths.push('Excellent activity - you\'re building great habits!');
  } else if (actionCount >= 3) {
    insights.strengths.push('Good activity - keep the momentum going!');
  } else {
    insights.opportunities.push('Try to use the platform more regularly for better results');
  }
  
  // Analyze stage progress
  const stageInfo = this.getStageInfo(progress.stage);
  if (progress.stage === 'pro') {
    insights.message = `Congratulations! You're a ${stageInfo.name} - your business skills are advanced.`;
  } else if (progress.stage === 'established') {
    insights.message = `You're ${stageInfo.name} and making excellent progress!`;
    insights.suggestions.push('Keep exploring new features to reach Pro level');
  } else if (progress.stage === 'growing') {
    insights.message = `You're ${stageInfo.name} and building momentum!`;
    insights.suggestions.push('Keep using the platform regularly to reach Established level');
  } else {
    insights.message = 'Welcome to your growth journey! Every expert was once a beginner.';
    insights.suggestions.push('Complete your business profile to unlock more features');
    insights.suggestions.push('Add daily reflections to track your progress');
  }
  
  // Badge-based suggestions
  const earnedBadges = progress.badges.length;
  const totalBadges = this.getAllBadges().length;
  
  if (earnedBadges < totalBadges / 2) {
    insights.suggestions.push(`You've earned ${earnedBadges} badges - explore more features to unlock ${totalBadges - earnedBadges} more!`);
  }
  
  // Activity-based insights
  const daysSinceLastActivity = Math.floor((new Date() - new Date(progress.lastUpdated)) / (1000 * 60 * 60 * 24));
  if (daysSinceLastActivity > 3) {
    insights.opportunities.push('Regular usage helps build better business habits');
  }
  
  return insights;
};
