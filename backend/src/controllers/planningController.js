const CalendarEngine = require('../services/calendarEngine');
const BusinessProfile = require('../models/BusinessProfile');
const OfferPlanningService = require('../services/offerPlanningService');

// @desc    Get monthly planning calendar
// @route   GET /api/planning/calendar
// @access  Private
exports.getMonthlyCalendar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;
    
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth();
    
    // Validate month (0-11)
    if (targetMonth < 0 || targetMonth > 11) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month. Must be between 0-11'
      });
    }
    
    // Get business profile for personalization
    const profile = await BusinessProfile.findOne({ userId });
    
    // Generate calendar events
    const events = CalendarEngine.generateMonthlyCalendar(targetYear, targetMonth);
    
    // Get best offer days for the month
    const bestOfferDays = CalendarEngine.getBestOfferDays(targetYear, targetMonth);
    
    // Group events by type
    const eventsByType = {
      festival: events.filter(e => e.type === 'festival'),
      salary: events.filter(e => e.type === 'salary'),
      market: events.filter(e => e.type === 'market')
    };
    
    res.json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth,
        monthName: new Date(targetYear, targetMonth).toLocaleString('default', { month: 'long' }),
        events,
        eventsByType,
        bestOfferDays,
        profile: {
          shopName: profile?.shopName || 'Your Shop',
          vendorType: profile?.vendorType || 'kirana'
        },
        summary: {
          totalEvents: events.length,
          festivalDays: eventsByType.festival.length,
          salaryDays: eventsByType.salary.length,
          marketDays: eventsByType.market.length,
          bestOfferDays: bestOfferDays.length
        }
      }
    });
    
  } catch (error) {
    console.error('Monthly calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly calendar',
      error: error.message
    });
  }
};

// @desc    Get events for specific date
// @route   GET /api/planning/date/:date
// @access  Private
exports.getEventsForDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    const events = CalendarEngine.getEventsForDate(date);
    
    // Generate AI suggestions for the date
    const suggestions = this.generateDateSuggestions(date, events);
    
    res.json({
      success: true,
      data: {
        date,
        events,
        suggestions,
        eventCount: events.length
      }
    });
    
  } catch (error) {
    console.error('Date events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events for date',
      error: error.message
    });
  }
};

// @desc    Get offer planning suggestions
// @route   GET /api/planning/offers
// @access  Private
exports.getOfferSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth();
    
    // Get business profile
    const profile = await BusinessProfile.findOne({ userId });
    
    // Get best offer days
    const bestOfferDays = CalendarEngine.getBestOfferDays(targetYear, targetMonth);
    
    // Generate detailed offer suggestions
    const offerSuggestions = bestOfferDays.map(day => {
      const events = CalendarEngine.getEventsForDate(day.date);
      return {
        ...day,
        events,
        detailedSuggestion: this.generateOfferSuggestion(day, events, profile?.vendorType),
        discountRange: this.getRecommendedDiscountRange(events),
        targetProducts: this.getTargetProducts(events, profile?.vendorType)
      };
    });
    
    res.json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        offerSuggestions,
        totalOpportunities: offerSuggestions.length,
        profile: {
          shopName: profile?.shopName || 'Your Shop',
          vendorType: profile?.vendorType || 'kirana'
        }
      }
    });
    
  } catch (error) {
    console.error('Offer suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get offer suggestions',
      error: error.message
    });
  }
};

// @desc    Get seasonal planning advice
// @route   GET /api/planning/seasonal
// @access  Private
exports.getSeasonalAdvice = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    
    // Get business profile
    const profile = await BusinessProfile.findOne({ userId });
    
    // Generate seasonal advice
    const seasonalAdvice = this.generateSeasonalAdvice(currentMonth, profile?.vendorType);
    
    // Get upcoming seasonal events (next 3 months)
    const upcomingEvents = [];
    for (let i = 0; i < 3; i++) {
      const month = (currentMonth + i) % 12;
      const year = currentMonth + i >= 12 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
      const monthEvents = CalendarEngine.generateMonthlyCalendar(year, month);
      upcomingEvents.push(...monthEvents.filter(e => e.type === 'festival'));
    }
    
    res.json({
      success: true,
      data: {
        currentMonth,
        seasonalAdvice,
        upcomingEvents: upcomingEvents.slice(0, 5), // Next 5 festivals
        profile: {
          shopName: profile?.shopName || 'Your Shop',
          vendorType: profile?.vendorType || 'kirana'
        }
      }
    });
    
  } catch (error) {
    console.error('Seasonal advice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get seasonal advice',
      error: error.message
    });
  }
};

// Helper functions
exports.generateDateSuggestions = (date, events) => {
  if (events.length === 0) {
    return ['Regular day. Focus on maintaining good customer service and stock organization.'];
  }
  
  const suggestions = [];
  
  events.forEach(event => {
    switch (event.type) {
      case 'festival':
        suggestions.push(`Festival day! ${event.suggestion}`);
        suggestions.push('Decorate your shop with festive items to attract customers.');
        break;
      case 'salary':
        suggestions.push(`Salary day advantage! ${event.suggestion}`);
        suggestions.push('Consider promoting premium products with attractive offers.');
        break;
      case 'market':
        suggestions.push(`Weekend market day! ${event.suggestion}`);
        suggestions.push('Ensure adequate stock and consider extended hours.');
        break;
    }
  });
  
  return suggestions;
};

exports.generateOfferSuggestion = (day, events, vendorType = 'kirana') => {
  const event = events[0]; // Primary event
  
  const suggestions = {
    festival: {
      kirana: 'Create festival combo packs with sweets, snacks, and decorative items. Offer 10-20% discount on bulk purchases.',
      clothing: 'Launch festive collection with traditional wear. Offer buy-2-get-1 deals on festival outfits.',
      rural: 'Stock festival essentials like oil, rice, and sweets. Offer family packs at discounted rates.'
    },
    salary: {
      kirana: 'Promote monthly essentials bundle. Offer 5-15% discount on household items and groceries.',
      clothing: 'Launch premium collection targeting salary earners. Offer EMI options for expensive items.',
      rural: 'Focus on agricultural supplies and household needs. Offer bulk discounts for farmers.'
    },
    market: {
      kirana: 'Weekend family packs and ready-to-eat items. Offer buy-2-get-1 on snacks and beverages.',
      clothing: 'Weekend shopping deals for families. Offer discounts on children and women\'s wear.',
      rural: 'Market day specials on daily essentials. Offer transportation discounts for bulk buyers.'
    }
  };
  
  return suggestions[event?.type]?.[vendorType] || 'Create attractive offers based on the day\'s significance.';
};

exports.getRecommendedDiscountRange = (events) => {
  if (events.some(e => e.type === 'festival' && e.impact === 'high')) {
    return '15-25%';
  } else if (events.some(e => e.type === 'salary')) {
    return '10-20%';
  } else if (events.some(e => e.type === 'market')) {
    return '5-15%';
  }
  return '5-10%';
};

exports.getTargetProducts = (events, vendorType = 'kirana') => {
  const productSuggestions = {
    festival: {
      kirana: ['Sweets', 'Snacks', 'Decorative items', 'Gift packs', 'Traditional foods'],
      clothing: ['Festive wear', 'Traditional outfits', 'Accessories', 'Footwear', 'Jewelry'],
      rural: ['Festival essentials', 'Cooking oil', 'Rice', 'Sweets', 'Decorations']
    },
    salary: {
      kirana: ['Monthly groceries', 'Household items', 'Personal care', 'Cleaning supplies', 'Bulk items'],
      clothing: ['Premium wear', 'Branded items', 'Seasonal collection', 'Accessories', 'Footwear'],
      rural: ['Agricultural supplies', 'Tools', 'Seeds', 'Fertilizers', 'Household needs']
    },
    market: {
      kirana: ['Ready-to-eat', 'Beverages', 'Snacks', 'Family packs', 'Fresh items'],
      clothing: ['Casual wear', 'Children\'s clothes', 'Women\'s wear', 'Seasonal items', 'Accessories'],
      rural: ['Daily essentials', 'Fresh produce', 'Basic clothing', 'Tools', 'Household items']
    }
  };
  
  const primaryEvent = events[0];
  return productSuggestions[primaryEvent?.type]?.[vendorType] || ['General items', 'Popular products', 'Seasonal items'];
};

exports.generateSeasonalAdvice = (month, vendorType = 'kirana') => {
  const seasonalAdvice = {
    // Winter months (Dec, Jan, Feb)
    winter: {
      kirana: 'Winter season: Stock warm beverages, comfort foods, and seasonal fruits. Promote hot snacks and winter essentials.',
      clothing: 'Winter collection: Focus on warm clothing, jackets, sweaters, and winter accessories. Clear summer stock.',
      rural: 'Winter farming: Stock seeds for winter crops, warm clothing, and heating essentials for rural customers.'
    },
    // Spring months (Mar, Apr, May)
    spring: {
      kirana: 'Spring season: Fresh fruits and vegetables in demand. Stock cooling items as weather warms up.',
      clothing: 'Spring collection: Light fabrics, bright colors, and transitional wear. Prepare for summer collection.',
      rural: 'Spring farming: High demand for seeds, fertilizers, and farming tools. Stock irrigation supplies.'
    },
    // Summer months (Jun, Jul, Aug)
    summer: {
      kirana: 'Summer season: Cold drinks, ice cream, and cooling products are essential. Stock summer fruits prominently.',
      clothing: 'Summer collection: Light, breathable fabrics, cotton wear, and summer accessories. Focus on comfort.',
      rural: 'Summer needs: Cooling products, summer clothing, and agricultural supplies for summer crops.'
    },
    // Monsoon months (Sep, Oct, Nov)
    monsoon: {
      kirana: 'Monsoon season: Stock umbrellas, raincoats, and indoor snacks. Promote hot beverages and comfort foods.',
      clothing: 'Monsoon wear: Waterproof items, quick-dry fabrics, and monsoon accessories. Protect inventory from moisture.',
      rural: 'Monsoon preparation: Rainwear, waterproof storage, and monsoon-resistant products for rural areas.'
    }
  };
  
  let season;
  if ([11, 0, 1].includes(month)) season = 'winter';
  else if ([2, 3, 4].includes(month)) season = 'spring';
  else if ([5, 6, 7].includes(month)) season = 'summer';
  else season = 'monsoon';
  
  return seasonalAdvice[season][vendorType];
};

// Route-expected methods
// @desc    Get planning calendar
// @route   GET /api/planning/calendar
// @access  Private
exports.getPlanningCalendar = exports.getMonthlyCalendar;

// @desc    Get offer recommendations
// @route   GET /api/planning/recommendations
// @access  Private
exports.getOfferRecommendations = exports.getOfferSuggestions;

// @desc    Lock a plan for future use
// @route   POST /api/planning/lock
// @access  Private
exports.lockPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planName, planData, scheduledDate } = req.body;
    
    if (!planName || !planData) {
      return res.status(400).json({
        success: false,
        message: 'Plan name and data are required'
      });
    }
    
    // For now, we'll store in business profile as locked plans
    const profile = await BusinessProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found'
      });
    }
    
    if (!profile.lockedPlans) {
      profile.lockedPlans = [];
    }
    
    const newPlan = {
      id: Date.now().toString(),
      name: planName,
      data: planData,
      scheduledDate,
      createdAt: new Date(),
      isActive: true
    };
    
    profile.lockedPlans.push(newPlan);
    await profile.save();
    
    res.json({
      success: true,
      message: 'Plan locked successfully',
      plan: newPlan
    });
    
  } catch (error) {
    console.error('Lock plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lock plan',
      error: error.message
    });
  }
};

// @desc    Get locked plans
// @route   GET /api/planning/locked
// @access  Private
exports.getLockedPlans = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const profile = await BusinessProfile.findOne({ userId });
    const lockedPlans = profile?.lockedPlans?.filter(plan => plan.isActive) || [];
    
    res.json({
      success: true,
      plans: lockedPlans
    });
    
  } catch (error) {
    console.error('Get locked plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get locked plans',
      error: error.message
    });
  }
};

// @desc    Delete locked plan
// @route   DELETE /api/planning/locked/:id
// @access  Private
exports.deleteLockedPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const profile = await BusinessProfile.findOne({ userId });
    if (!profile || !profile.lockedPlans) {
      return res.status(404).json({
        success: false,
        message: 'No locked plans found'
      });
    }
    
    const planIndex = profile.lockedPlans.findIndex(plan => plan.id === id);
    if (planIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    profile.lockedPlans[planIndex].isActive = false;
    await profile.save();
    
    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete locked plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete plan',
      error: error.message
    });
  }
};

// @desc    Get AI-powered offer recommendations
// @route   GET /api/planning/offers
// @access  Private
exports.getOfferRecommendations = async (req, res) => {
  try {
    const businessId = req.user.id;
    const { category } = req.query;
    
    console.log('🎯 Getting offer recommendations for business:', businessId);
    
    const offerService = new OfferPlanningService();
    const recommendations = await offerService.getOfferRecommendations(businessId, category);
    
    if (!recommendations.hasData) {
      return res.status(200).json({
        success: true,
        message: 'No products with pricing data found for offer planning',
        data: [],
        hasData: false,
        suggestion: 'Add cost prices to your inventory items to enable AI-powered offer planning'
      });
    }
    
    res.json({
      success: true,
      data: recommendations.data,
      marketInsight: recommendations.marketInsight,
      summary: recommendations.summary,
      hasData: true,
      generatedAt: new Date(),
      message: `Generated ${recommendations.data.length} offer recommendations`
    });
    
  } catch (error) {
    console.error('Offer recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate offer recommendations',
      error: error.message,
      suggestion: 'Please ensure your inventory has products with cost prices added'
    });
  }
};

// @desc    Get single product offer recommendation
// @route   GET /api/planning/offers/:productId
// @access  Private
exports.getProductOfferRecommendation = async (req, res) => {
  try {
    const businessId = req.user.id;
    const { productId } = req.params;
    
    console.log('🎯 Getting offer recommendation for product:', productId);
    
    const InventoryItem = require('../models/InventoryItem');
    const product = await InventoryItem.findOne({ _id: productId, businessId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (!product.costPrice || product.costPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product cost price is required for offer planning',
        suggestion: 'Please add cost price to this product first'
      });
    }
    
    const offerService = new OfferPlanningService();
    
    // Get market trends for this product's category
    const marketTrend = await offerService.getMarketTrendInsights(
      product.category || 'General', 
      businessId
    );
    
    // Generate recommendation for this specific product
    const recommendation = await offerService.generateOfferRecommendation(
      product, 
      marketTrend, 
      businessId
    );
    
    const result = {
      productId: product._id,
      productName: product.productName,
      category: product.category,
      currentQuantity: product.quantity,
      stockStatus: product.quantity > product.minStockLevel ? 'SAFE' : 'LOW',
      pricing: {
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        mrp: product.mrp
      },
      recommendation,
      marketInsight: {
        category: product.category || 'General',
        insight: marketTrend.insight,
        dayOfWeek: marketTrend.dayOfWeek,
        monthName: marketTrend.monthName,
        isSalaryTime: marketTrend.isSalaryTime,
        isWeekend: marketTrend.isWeekend,
        generatedAt: marketTrend.generatedAt,
        fallback: marketTrend.fallback
      },
      lastPriceUpdated: product.lastPriceUpdatedAt
    };
    
    res.json({
      success: true,
      data: result,
      generatedAt: new Date(),
      message: `Generated offer recommendation for ${product.productName}`
    });
    
  } catch (error) {
    console.error('Product offer recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate product offer recommendation',
      error: error.message
    });
  }
};

// @desc    Predict discount impact using AI
// @route   POST /api/planning/predict-discount
// @access  Private
exports.predictDiscountImpact = async (req, res) => {
  try {
    const businessId = req.user.id;
    const { productIds, discountPercent } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }
    
    if (!discountPercent || discountPercent <= 0 || discountPercent > 50) {
      return res.status(400).json({
        success: false,
        message: 'Valid discount percentage (1-50) is required'
      });
    }
    
    console.log(`🔮 Predicting discount impact for ${productIds.length} products with ${discountPercent}% discount`);
    
    const InventoryItem = require('../models/InventoryItem');
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    const products = await InventoryItem.find({ 
      _id: { $in: productIds }, 
      businessId,
      costPrice: { $ne: null, $gt: 0 },
      sellingPrice: { $ne: null, $gt: 0 }
    });
    
    if (products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid products found with complete pricing data'
      });
    }
    
    const predictions = [];
    
    for (const product of products) {
      try {
        const finalPrice = product.sellingPrice * (1 - discountPercent / 100);
        const profitPerUnit = finalPrice - product.costPrice;
        const profitMargin = ((profitPerUnit / product.costPrice) * 100);
        
        // Prepare AI prompt for market analysis
        const prompt = `You are a retail pricing expert analyzing discount impact for a small Indian shop.

Product Analysis:
- Product: ${product.productName}
- Category: ${product.category || 'General'}
- Cost Price: ₹${product.costPrice}
- Current Selling Price: ₹${product.sellingPrice}
- Proposed Discount: ${discountPercent}%
- Final Price After Discount: ₹${finalPrice.toFixed(2)}
- Stock Quantity: ${product.quantity}
- Profit Per Unit After Discount: ₹${profitPerUnit.toFixed(2)}
- Profit Margin After Discount: ${profitMargin.toFixed(1)}%

Provide a concise analysis in this JSON format:
{
  "marketPrice": <estimated market price for similar products>,
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "recommendation": "<30-40 words practical business recommendation>",
  "suggestedDiscount": <optimal discount percentage between 1-30>,
  "competitiveAdvantage": "<brief note on how this pricing compares to market>"
}

Guidelines:
- LOW risk: Profit margin > 15%
- MEDIUM risk: Profit margin 5-15%
- HIGH risk: Profit margin < 5% or negative
- Consider Indian market dynamics and small shop economics
- Suggest realistic discount that maintains healthy margins`;

        let aiPrediction = null;
        
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          
          const result = await model.generateContent(prompt);
          const aiResponse = result.response.text();
          
          // Try to parse JSON response
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiPrediction = JSON.parse(jsonMatch[0]);
          }
        } catch (aiError) {
          console.log('AI prediction failed, using fallback analysis:', aiError.message);
        }
        
        // Fallback analysis if AI fails
        if (!aiPrediction) {
          aiPrediction = {
            marketPrice: product.sellingPrice * 1.1, // Estimate 10% higher market price
            riskLevel: profitMargin > 15 ? 'LOW' : profitMargin > 5 ? 'MEDIUM' : 'HIGH',
            recommendation: profitMargin > 0 
              ? 'Discount maintains positive margins. Safe to proceed.' 
              : 'High risk of losses. Consider reducing discount percentage.',
            suggestedDiscount: Math.max(1, Math.min(30, profitMargin / 2)),
            competitiveAdvantage: 'Standard market positioning'
          };
        }
        
        const prediction = {
          productId: product._id,
          productName: product.productName,
          category: product.category,
          currentPrice: product.sellingPrice,
          finalPrice: finalPrice,
          discountPercent: discountPercent,
          profitPerUnit: profitPerUnit,
          profitMargin: profitMargin,
          expectedLoss: profitPerUnit < 0 ? Math.abs(profitPerUnit) : 0,
          stockQuantity: product.quantity,
          marketPrice: aiPrediction.marketPrice || product.sellingPrice,
          riskLevel: aiPrediction.riskLevel || 'MEDIUM',
          recommendation: aiPrediction.recommendation || 'Analysis completed',
          suggestedDiscount: aiPrediction.suggestedDiscount || discountPercent,
          competitiveAdvantage: aiPrediction.competitiveAdvantage || 'Standard positioning',
          aiPowered: !!aiPrediction
        };
        
        predictions.push(prediction);
        
      } catch (error) {
        console.error(`Failed to analyze product ${product._id}:`, error);
        // Add basic prediction without AI
        const finalPrice = product.sellingPrice * (1 - discountPercent / 100);
        const profitPerUnit = finalPrice - product.costPrice;
        
        predictions.push({
          productId: product._id,
          productName: product.productName,
          category: product.category,
          currentPrice: product.sellingPrice,
          finalPrice: finalPrice,
          discountPercent: discountPercent,
          profitPerUnit: profitPerUnit,
          profitMargin: ((profitPerUnit / product.costPrice) * 100),
          expectedLoss: profitPerUnit < 0 ? Math.abs(profitPerUnit) : 0,
          stockQuantity: product.quantity,
          marketPrice: product.sellingPrice,
          riskLevel: profitPerUnit > 0 ? 'LOW' : 'HIGH',
          recommendation: 'Basic calculation completed',
          suggestedDiscount: discountPercent,
          competitiveAdvantage: 'Analysis unavailable',
          aiPowered: false
        });
      }
    }
    
    // Calculate summary
    const summary = {
      totalProducts: predictions.length,
      safeDiscounts: predictions.filter(p => p.riskLevel === 'LOW').length,
      riskyDiscounts: predictions.filter(p => p.riskLevel === 'HIGH').length,
      totalPotentialProfit: predictions.reduce((sum, p) => sum + (p.profitPerUnit * p.stockQuantity), 0),
      averageMargin: predictions.reduce((sum, p) => sum + p.profitMargin, 0) / predictions.length
    };
    
    res.json({
      success: true,
      predictions,
      summary,
      discountPercent,
      generatedAt: new Date(),
      message: `Analyzed ${predictions.length} products for ${discountPercent}% discount impact`
    });
    
  } catch (error) {
    console.error('Discount prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict discount impact',
      error: error.message
    });
  }
};