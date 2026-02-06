const { GoogleGenerativeAI } = require('@google/generative-ai');
const InventoryItem = require('../models/InventoryItem');
const AILog = require('../models/AILog');

class OfferPlanningService {
  constructor() {
    this.minimumMarginPercentage = 10; // Default 10% minimum margin
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Get market trend insights using Gemini AI reasoning
   */
  async getMarketTrendInsights(category, userId) {
    try {
      const currentDate = new Date();
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
      const dayOfMonth = currentDate.getDate();
      
      // Check if it's a salary day (typically end/start of month)
      const isSalaryTime = dayOfMonth <= 5 || dayOfMonth >= 25;
      const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

      const prompt = `You are a market analyst for small retail businesses in India.

Today is ${dayOfWeek}, ${monthName} ${dayOfMonth}.
${isSalaryTime ? 'This is salary time (people have more spending power).' : ''}
${isWeekend ? 'This is weekend (higher footfall expected).' : ''}

Analyze the current market condition for "${category}" products considering:
- Current season and month
- Day of week and salary cycle
- Indian festivals and shopping patterns
- General demand trends for this category

Provide insights about:
- Current demand level (high/medium/low)
- Price sensitivity of customers
- Best discount strategy
- Risk factors to consider

Be specific and practical for a small Indian retailer.`;

      console.log('🔍 Analyzing market trends with Gemini for category:', category);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const marketInsight = response.text();

      // Log the AI call
      await this.logAIUsage(userId, 'market_analysis', prompt, true, null, {
        category,
        analysisDate: currentDate.toISOString()
      });

      return {
        insight: marketInsight,
        dayOfWeek,
        monthName,
        isSalaryTime,
        isWeekend,
        generatedAt: currentDate
      };
    } catch (error) {
      console.error('Error getting market trends:', error);
      
      // Log the failed AI call
      await this.logAIUsage(userId, 'market_analysis', '', false, error.message, { category });

      // Return fallback insight
      return {
        insight: 'Market data unavailable. Using safe pricing strategy based on inventory costs.',
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        monthName: new Date().toLocaleDateString('en-US', { month: 'long' }),
        isSalaryTime: false,
        isWeekend: false,
        generatedAt: new Date(),
        fallback: true
      };
    }
  }

  /**
   * Calculate safe offer pricing for a product
   */
  calculateSafeOffer(product, marketTrend) {
    const { costPrice, sellingPrice, mrp } = product;
    
    // Need cost price to calculate safe margin
    if (!costPrice || costPrice <= 0) {
      return {
        canOffer: false,
        reason: 'Cost price not available. Cannot calculate safe discount.',
        recommendedAction: 'Please update cost price for this product to enable offer planning.'
      };
    }

    const minimumSafePrice = costPrice * (1 + this.minimumMarginPercentage / 100);
    const currentPrice = sellingPrice || mrp || costPrice * 1.5; // Fallback pricing
    
    if (currentPrice <= minimumSafePrice) {
      return {
        canOffer: false,
        reason: 'Current selling price is too close to cost. No safe discount possible.',
        currentPrice,
        minimumSafePrice,
        currentMargin: ((currentPrice - costPrice) / costPrice * 100).toFixed(1)
      };
    }

    // Calculate maximum safe discount
    const maxDiscount = currentPrice - minimumSafePrice;
    const maxDiscountPercentage = (maxDiscount / currentPrice * 100);

    // Suggest conservative discount (50% of maximum safe discount)
    const suggestedDiscount = maxDiscount * 0.5;
    const suggestedPrice = currentPrice - suggestedDiscount;
    const suggestedDiscountPercentage = (suggestedDiscount / currentPrice * 100);

    // Determine risk level
    let riskLevel = 'LOW';
    if (suggestedDiscountPercentage > 15) riskLevel = 'MEDIUM';
    if (suggestedDiscountPercentage > 25) riskLevel = 'HIGH';

    const finalMargin = ((suggestedPrice - costPrice) / costPrice * 100);

    return {
      canOffer: true,
      currentPrice,
      suggestedPrice: Math.round(suggestedPrice),
      suggestedDiscount: Math.round(suggestedDiscount),
      suggestedDiscountPercentage: suggestedDiscountPercentage.toFixed(1),
      maxSafeDiscount: Math.round(maxDiscount),
      maxSafeDiscountPercentage: maxDiscountPercentage.toFixed(1),
      finalMargin: finalMargin.toFixed(1),
      riskLevel,
      marginStatus: finalMargin >= this.minimumMarginPercentage ? 'SAFE' : 'RISKY'
    };
  }

  /**
   * Generate AI-powered offer recommendations
   */
  async generateOfferRecommendation(product, marketTrend, userId) {
    try {
      const safeOffer = this.calculateSafeOffer(product, marketTrend);
      
      if (!safeOffer.canOffer) {
        return {
          product: product.productName,
          marketTrend: marketTrend.insight.substring(0, 200) + '...',
          recommendedDiscount: 'No Discount',
          finalPrice: null,
          marginStatus: 'NOT RECOMMENDED',
          riskLevel: 'HIGH',
          reason: safeOffer.reason
        };
      }

      const prompt = `You are a pricing strategist for an Indian retail shop.

PRODUCT: ${product.productName}
CATEGORY: ${product.category || 'General'}
CURRENT PRICE: ₹${safeOffer.currentPrice}
COST PRICE: ₹${product.costPrice}
MAX SAFE DISCOUNT: ₹${safeOffer.maxSafeDiscount} (${safeOffer.maxSafeDiscountPercentage}%)
SUGGESTED SAFE DISCOUNT: ₹${safeOffer.suggestedDiscount} (${safeOffer.suggestedDiscountPercentage}%)

MARKET ANALYSIS:
${marketTrend.insight}

Based on the market analysis and pricing constraints, recommend the final offer.
Consider:
- Customer price sensitivity
- Competition
- Profit margin safety
- Market timing

RESPOND ONLY WITH VALID JSON:
{
  "product": "${product.productName}",
  "marketTrend": "Brief market summary (max 100 chars)",
  "recommendedDiscount": "₹X or X% or 'No Discount'",
  "finalPrice": ${safeOffer.suggestedPrice},
  "marginStatus": "SAFE",
  "riskLevel": "${safeOffer.riskLevel}",
  "reason": "Clear explanation why this offer is recommended (max 150 chars)"
}`;

      console.log('🧠 Generating offer recommendation with Gemini for:', product.productName);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response safely
      let recommendation;
      try {
        const jsonMatch = text.match(/\{[^}]+\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        recommendation = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse Gemini recommendation:', parseError);
        
        // Fallback recommendation
        recommendation = {
          product: product.productName,
          marketTrend: marketTrend.insight.substring(0, 100),
          recommendedDiscount: `₹${safeOffer.suggestedDiscount}`,
          finalPrice: safeOffer.suggestedPrice,
          marginStatus: safeOffer.marginStatus,
          riskLevel: safeOffer.riskLevel,
          reason: `Safe ${safeOffer.suggestedDiscountPercentage}% discount maintaining ${safeOffer.finalMargin}% margin`
        };
      }

      // Log successful AI call
      await this.logAIUsage(userId, 'offer_recommendation', prompt.substring(0, 500), true, null, {
        productName: product.productName,
        recommendedDiscount: recommendation.recommendedDiscount,
        finalPrice: recommendation.finalPrice
      });

      return recommendation;

    } catch (error) {
      console.error('Error generating offer recommendation:', error);
      
      // Log failed AI call
      await this.logAIUsage(userId, 'offer_recommendation', '', false, error.message, {
        productName: product.productName
      });

      // Return safe fallback recommendation
      const safeOffer = this.calculateSafeOffer(product, marketTrend);
      
      return {
        product: product.productName,
        marketTrend: 'Market analysis unavailable, using safe pricing',
        recommendedDiscount: safeOffer.canOffer ? `₹${safeOffer.suggestedDiscount}` : 'No Discount',
        finalPrice: safeOffer.canOffer ? safeOffer.suggestedPrice : null,
        marginStatus: safeOffer.canOffer ? safeOffer.marginStatus : 'NOT RECOMMENDED',
        riskLevel: safeOffer.canOffer ? safeOffer.riskLevel : 'HIGH',
        reason: safeOffer.canOffer ? 
          `Conservative ${safeOffer.suggestedDiscountPercentage}% discount for safe margin` :
          safeOffer.reason,
        fallback: true
      };
    }
  }

  /**
   * Get offer recommendations for all products with pricing data
   */
  async getOfferRecommendations(businessId, category = null) {
    try {
      const query = { businessId };
      if (category) {
        query.category = category;
      }
      
      // Only get products with cost price for offer planning
      query.costPrice = { $ne: null, $gt: 0 };
      
      const products = await InventoryItem.find(query);
      
      if (products.length === 0) {
        return {
          success: true,
          message: 'No products with pricing data found. Please add cost prices to enable offer planning.',
          data: [],
          hasData: false
        };
      }

      // Get market insights for the category or general retail
      const analysisCategory = category || products[0]?.category || 'General Retail';
      const marketTrend = await this.getMarketTrendInsights(analysisCategory, businessId);

      // Generate recommendations for each product
      const recommendations = await Promise.all(
        products.map(async (product) => {
          const recommendation = await this.generateOfferRecommendation(product, marketTrend, businessId);
          
          return {
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
            lastPriceUpdated: product.lastPriceUpdatedAt
          };
        })
      );

      return {
        success: true,
        data: recommendations,
        marketInsight: {
          category: analysisCategory,
          insight: marketTrend.insight,
          dayOfWeek: marketTrend.dayOfWeek,
          monthName: marketTrend.monthName,
          isSalaryTime: marketTrend.isSalaryTime,
          isWeekend: marketTrend.isWeekend,
          generatedAt: marketTrend.generatedAt,
          fallback: marketTrend.fallback
        },
        summary: {
          totalProducts: recommendations.length,
          productsWithOffers: recommendations.filter(r => r.recommendation.finalPrice !== null).length,
          safeOffers: recommendations.filter(r => r.recommendation.marginStatus === 'SAFE').length,
          riskyOffers: recommendations.filter(r => r.recommendation.riskLevel === 'HIGH').length
        },
        hasData: true
      };
      
    } catch (error) {
      console.error('Error getting offer recommendations:', error);
      throw error;
    }
  }

  /**
   * Log AI usage for tracking and analytics
   */
  async logAIUsage(userId, action, prompt, success, errorMessage = null, metadata = {}) {
    try {
      const logEntry = new AILog({
        user: userId,
        action: 'orchestrate', // Using existing enum value
        prompt: prompt.substring(0, 500), // Limit prompt length
        apiUsed: 'gemini',
        success,
        errorMessage,
        metadata: {
          ...metadata,
          offerPlanningAction: action,
          timestamp: new Date().toISOString()
        }
      });
      
      await logEntry.save();
    } catch (logError) {
      console.error('Error logging AI usage:', logError);
      // Don't throw - logging failure shouldn't break the main function
    }
  }
}

module.exports = OfferPlanningService;
