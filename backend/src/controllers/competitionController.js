const CompetitorPrice = require('../models/CompetitorPrice');
const BusinessProfile = require('../models/BusinessProfile');
const GrowthEngine = require('../services/growthEngine');

// @desc    Add competitor price comparison
// @route   POST /api/competition/compare
// @access  Private
exports.addComparison = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productName, competitorPrice, yourPrice, competitorName } = req.body;
    
    // Validate required fields
    if (!productName || !competitorPrice || !yourPrice || !competitorName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: productName, competitorPrice, yourPrice, competitorName'
      });
    }
    
    // Validate price values
    if (competitorPrice <= 0 || yourPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Prices must be greater than 0'
      });
    }
    
    // Create new comparison with calculated fields
    const yourPriceNum = parseFloat(yourPrice);
    const competitorPriceNum = parseFloat(competitorPrice);
    
    // Calculate comparison result
    let comparisonResult;
    if (yourPriceNum < competitorPriceNum) {
      comparisonResult = 'lower';
    } else if (yourPriceNum === competitorPriceNum) {
      comparisonResult = 'same';
    } else {
      comparisonResult = 'higher';
    }
    
    // Calculate differences
    const priceDifference = Math.abs(yourPriceNum - competitorPriceNum);
    const percentageDifference = ((priceDifference / competitorPriceNum) * 100);
    
    const comparison = new CompetitorPrice({
      userId,
      productName: productName.trim(),
      competitorPrice: competitorPriceNum,
      yourPrice: yourPriceNum,
      competitorName: competitorName.trim(),
      comparisonResult,
      priceDifference,
      percentageDifference
    });
    
    // Generate AI advice
    comparison.aiAdvice = this.generateAIAdvice(comparison);
    
    await comparison.save();
    
    // Record action for growth tracking
    await GrowthEngine.recordAction(userId, 'price_comparison');
    
    res.status(201).json({
      success: true,
      message: 'Price comparison added successfully',
      comparison
    });
    
  } catch (error) {
    console.error('Add comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add price comparison',
      error: error.message
    });
  }
};

// @desc    Get all price comparisons
// @route   GET /api/competition/comparisons
// @access  Private
exports.getComparisons = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page = 1, status } = req.query;
    
    const query = { userId, isActive: true };
    
    // Filter by comparison result if specified
    if (status && ['lower', 'same', 'higher'].includes(status)) {
      query.comparisonResult = status;
    }
    
    const skip = (page - 1) * limit;
    
    const comparisons = await CompetitorPrice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await CompetitorPrice.countDocuments(query);
    
    // Calculate summary statistics
    const allComparisons = await CompetitorPrice.find({ userId, isActive: true });
    const summary = this.calculateSummaryStats(allComparisons);
    
    res.json({
      success: true,
      data: {
        comparisons,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get comparisons error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get price comparisons',
      error: error.message
    });
  }
};

// @desc    Get specific comparison details
// @route   GET /api/competition/comparison/:id
// @access  Private
exports.getComparisonDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const comparison = await CompetitorPrice.findOne({ _id: id, userId });
    
    if (!comparison) {
      return res.status(404).json({
        success: false,
        message: 'Price comparison not found'
      });
    }
    
    // Generate customer response suggestions
    const customerResponses = this.generateCustomerResponses(comparison);
    
    res.json({
      success: true,
      data: {
        comparison,
        customerResponses,
        analysis: {
          priceDifference: comparison.priceDifference,
          percentageDifference: comparison.percentageDifference.toFixed(1),
          comparisonResult: comparison.comparisonResult,
          aiAdvice: comparison.aiAdvice
        }
      }
    });
    
  } catch (error) {
    console.error('Get comparison details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comparison details',
      error: error.message
    });
  }
};

// @desc    Update price comparison
// @route   PUT /api/competition/comparison/:id
// @access  Private
exports.updateComparison = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { competitorPrice, yourPrice } = req.body;
    
    const comparison = await CompetitorPrice.findOne({ _id: id, userId });
    
    if (!comparison) {
      return res.status(404).json({
        success: false,
        message: 'Price comparison not found'
      });
    }
    
    // Update prices if provided
    if (competitorPrice !== undefined) {
      comparison.competitorPrice = parseFloat(competitorPrice);
    }
    if (yourPrice !== undefined) {
      comparison.yourPrice = parseFloat(yourPrice);
    }
    
    // Regenerate AI advice with updated prices
    comparison.aiAdvice = this.generateAIAdvice(comparison);
    
    await comparison.save();
    
    res.json({
      success: true,
      message: 'Price comparison updated successfully',
      comparison
    });
    
  } catch (error) {
    console.error('Update comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update price comparison',
      error: error.message
    });
  }
};

// @desc    Delete price comparison
// @route   DELETE /api/competition/comparison/:id
// @access  Private
exports.deleteComparison = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const comparison = await CompetitorPrice.findOne({ _id: id, userId });
    
    if (!comparison) {
      return res.status(404).json({
        success: false,
        message: 'Price comparison not found'
      });
    }
    
    // Soft delete by setting isActive to false
    comparison.isActive = false;
    await comparison.save();
    
    res.json({
      success: true,
      message: 'Price comparison deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete price comparison',
      error: error.message
    });
  }
};

// @desc    Get competitive analysis summary
// @route   GET /api/competition/analysis
// @access  Private
exports.getCompetitiveAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all active comparisons
    const comparisons = await CompetitorPrice.find({ userId, isActive: true })
      .sort({ createdAt: -1 });
    
    if (comparisons.length === 0) {
      return res.json({
        success: true,
        data: {
          message: 'No price comparisons found. Add some competitor prices to get analysis.',
          comparisons: [],
          analysis: null
        }
      });
    }
    
    // Calculate comprehensive analysis
    const analysis = this.generateCompetitiveAnalysis(comparisons);
    
    // Get business profile for personalized advice
    const profile = await BusinessProfile.findOne({ userId });
    
    res.json({
      success: true,
      data: {
        analysis,
        comparisons: comparisons.slice(0, 5), // Recent 5 comparisons
        totalComparisons: comparisons.length,
        profile: {
          shopName: profile?.shopName || 'Your Shop',
          vendorType: profile?.vendorType || 'kirana'
        }
      }
    });
    
  } catch (error) {
    console.error('Competitive analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get competitive analysis',
      error: error.message
    });
  }
};

// Helper functions
exports.generateAIAdvice = (comparison) => {
  const { comparisonResult, priceDifference, percentageDifference, productName, competitorName } = comparison;
  
  switch (comparisonResult) {
    case 'lower':
      if (percentageDifference > 20) {
        return `Excellent! You're ₹${priceDifference.toFixed(2)} (${percentageDifference.toFixed(1)}%) cheaper than ${competitorName}. This is a strong competitive advantage. Highlight this price difference to customers and consider promoting this product.`;
      } else {
        return `Good positioning! You're ₹${priceDifference.toFixed(2)} cheaper than ${competitorName}. This gives you a competitive edge. You can confidently promote your better pricing to customers.`;
      }
      
    case 'same':
      return `You're at the same price as ${competitorName} for ${productName}. Focus on better service, quality, or convenience to win customers. Consider small value-adds like free delivery, better packaging, or loyalty rewards.`;
      
    case 'higher':
      if (percentageDifference > 20) {
        return `You're ₹${priceDifference.toFixed(2)} (${percentageDifference.toFixed(1)}%) higher than ${competitorName}. This is significant. Consider if you can reduce the price or emphasize superior quality, service, or convenience to justify the premium.`;
      } else {
        return `You're ₹${priceDifference.toFixed(2)} (${percentageDifference.toFixed(1)}%) higher than ${competitorName}. This small premium is acceptable if you offer better quality or service. Communicate your value proposition clearly to customers.`;
      }
      
    default:
      return 'Monitor this price regularly to stay competitive in the market.';
  }
};

exports.generateCustomerResponses = (comparison) => {
  const { comparisonResult, productName, yourPrice, priceDifference, competitorName } = comparison;
  
  const responses = {
    lower: [
      `"We offer the best price in the area! ${productName} is available for just ₹${yourPrice}, which is ₹${priceDifference.toFixed(2)} less than other shops."`,
      `"You won't find ${productName} cheaper anywhere else. We guarantee the best price at ₹${yourPrice}."`,
      `"Our ${productName} is ₹${priceDifference.toFixed(2)} cheaper than ${competitorName}. Same quality, better price!"`
    ],
    same: [
      `"Our price for ${productName} is ₹${yourPrice}, same as others, but we provide better quality and service."`,
      `"${productName} is ₹${yourPrice}. We also offer free home delivery for orders above ₹200."`,
      `"Same price as others at ₹${yourPrice}, but we guarantee freshness and quality."`
    ],
    higher: [
      `"${productName} is ₹${yourPrice}. We maintain premium quality and freshness, which is worth the small difference."`,
      `"Our ${productName} costs ₹${yourPrice}. Our customers choose us for reliability and better service."`,
      `"Yes, it's ₹${yourPrice}. We focus on quality over cheap pricing. You get what you pay for."`
    ]
  };
  
  return responses[comparisonResult] || [`"${productName} is available for ₹${yourPrice}. We ensure best quality and service."`];
};

exports.calculateSummaryStats = (comparisons) => {
  if (comparisons.length === 0) {
    return {
      total: 0,
      cheaper: 0,
      same: 0,
      expensive: 0,
      averageDifference: 0
    };
  }
  
  const stats = {
    total: comparisons.length,
    cheaper: comparisons.filter(c => c.comparisonResult === 'lower').length,
    same: comparisons.filter(c => c.comparisonResult === 'same').length,
    expensive: comparisons.filter(c => c.comparisonResult === 'higher').length
  };
  
  // Calculate average price difference
  const totalDifference = comparisons.reduce((sum, c) => sum + c.priceDifference, 0);
  stats.averageDifference = (totalDifference / comparisons.length).toFixed(2);
  
  return stats;
};

exports.generateCompetitiveAnalysis = (comparisons) => {
  const stats = this.calculateSummaryStats(comparisons);
  
  let overallPosition = 'competitive';
  let recommendation = '';
  
  if (stats.cheaper > stats.expensive) {
    overallPosition = 'price_leader';
    recommendation = 'You have strong price leadership. Leverage this advantage in your marketing and customer communication.';
  } else if (stats.expensive > stats.cheaper) {
    overallPosition = 'premium';
    recommendation = 'You\'re positioned as premium. Focus on quality, service, and value-added benefits to justify higher prices.';
  } else {
    overallPosition = 'balanced';
    recommendation = 'You have a balanced pricing strategy. Focus on service differentiation and customer experience.';
  }
  
  return {
    overallPosition,
    recommendation,
    stats,
    competitiveStrength: stats.cheaper / stats.total * 100,
    riskProducts: comparisons.filter(c => c.comparisonResult === 'higher' && c.percentageDifference > 15).length
  };
};

// Route-expected methods
// @desc    Add competitor price
// @route   POST /api/competition/price
// @access  Private
exports.addCompetitorPrice = exports.addComparison;

// @desc    Get competitor prices
// @route   GET /api/competition/prices
// @access  Private
exports.getCompetitorPrices = exports.getComparisons;

// @desc    Get price comparison
// @route   GET /api/competition/comparison
// @access  Private
exports.getPriceComparison = exports.getCompetitiveAnalysis;

// @desc    Get pricing suggestions
// @route   GET /api/competition/suggestions
// @access  Private
exports.getPricingSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const comparisons = await CompetitorPrice.find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(10);
    
    const suggestions = comparisons.map(comparison => ({
      product: comparison.productName,
      currentPrice: comparison.yourPrice,
      competitorPrice: comparison.competitorPrice,
      suggestion: comparison.aiAdvice,
      action: comparison.comparisonResult === 'higher' ? 'consider_reducing' : 
              comparison.comparisonResult === 'lower' ? 'promote_advantage' : 'maintain_position'
    }));
    
    res.json({
      success: true,
      suggestions
    });
    
  } catch (error) {
    console.error('Pricing suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing suggestions',
      error: error.message
    });
  }
};

// @desc    Delete competitor price
// @route   DELETE /api/competition/price/:id
// @access  Private
exports.deleteCompetitorPrice = exports.deleteComparison;
