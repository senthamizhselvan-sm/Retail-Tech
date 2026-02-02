const { GoogleGenerativeAI } = require('@google/generative-ai');
const BusinessProfile = require('../models/BusinessProfile');
const InventoryItem = require('../models/InventoryItem');
const AILog = require('../models/AILog');

class GeminiDailyAdvice {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateRealTimeAdvice(userId, category = 'all') {
    try {
      // Get user business profile and inventory data
      const profile = await BusinessProfile.findOne({ userId });
      const inventory = await InventoryItem.find({ userId }).limit(20);
      
      const currentDate = new Date();
      const timeContext = this.getTimeContext(currentDate);
      const businessContext = await this.getBusinessContext(profile, inventory);

      const prompt = this.buildAdvicePrompt(category, timeContext, businessContext);

      console.log('Generating real-time advice with Gemini...');

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const adviceText = response.text();

      // Parse the structured response
      let adviceData;
      try {
        adviceData = JSON.parse(adviceText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        adviceData = this.fallbackAdvice(category, timeContext);
      }

      // Log AI interaction
      await AILog.create({
        userId,
        feature: 'daily_advice',
        prompt: prompt.substring(0, 500),
        response: adviceText.substring(0, 1000),
        successful: true
      });

      return {
        success: true,
        advice: adviceData,
        generatedAt: new Date(),
        context: {
          timeOfDay: timeContext.timeOfDay,
          dayType: timeContext.dayType,
          shopType: profile?.vendorType || 'retail'
        }
      };

    } catch (error) {
      console.error('Gemini daily advice error:', error);

      // Log failed AI interaction
      await AILog.create({
        userId,
        feature: 'daily_advice',
        prompt: 'Failed to generate prompt',
        response: error.message,
        successful: false
      });

      // Return fallback advice
      const currentDate = new Date();
      const timeContext = this.getTimeContext(currentDate);
      
      return {
        success: false,
        advice: this.fallbackAdvice(category, timeContext),
        generatedAt: new Date(),
        context: {
          timeOfDay: timeContext.timeOfDay,
          dayType: timeContext.dayType,
          shopType: 'retail'
        },
        error: 'Using fallback advice due to AI service error'
      };
    }
  }

  getTimeContext(date) {
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const month = date.getMonth();

    let timeOfDay;
    if (hour < 6) timeOfDay = 'early_morning';
    else if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    let seasonType;
    if (month >= 3 && month <= 6) seasonType = 'summer';
    else if (month >= 7 && month <= 9) seasonType = 'monsoon';
    else if (month >= 10 && month <= 1) seasonType = 'winter';
    else seasonType = 'spring';

    return {
      timeOfDay,
      hour,
      dayType: isWeekend ? 'weekend' : 'weekday',
      seasonType,
      date: date.toDateString()
    };
  }

  async getBusinessContext(profile, inventory) {
    const fastMovingItems = inventory
      .filter(item => item.quantity < item.minimumStock)
      .slice(0, 5);

    const lowStockItems = inventory
      .filter(item => item.quantity <= 5)
      .slice(0, 3);

    const recentlyAdded = inventory
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      .slice(0, 3);

    return {
      shopName: profile?.shopName || 'your shop',
      vendorType: profile?.vendorType || 'retail',
      location: profile?.location || 'local area',
      totalProducts: inventory.length,
      fastMovingItems: fastMovingItems.map(item => item.name),
      lowStockItems: lowStockItems.map(item => ({ name: item.name, quantity: item.quantity })),
      recentProducts: recentlyAdded.map(item => item.name)
    };
  }

  buildAdvicePrompt(category, timeContext, businessContext) {
    const basePrompt = `You are an AI business advisor for small retail shops in India. Generate personalized daily advice for a ${businessContext.vendorType} shop owner.

Current Context:
- Time: ${timeContext.timeOfDay} (${timeContext.hour}:00) on ${timeContext.dayType}
- Season: ${timeContext.seasonType}
- Shop: ${businessContext.shopName}
- Location: ${businessContext.location}
- Total Products: ${businessContext.totalProducts}
- Low Stock Items: ${businessContext.lowStockItems.map(item => `${item.name} (${item.quantity} left)`).join(', ')}
- Recent Additions: ${businessContext.recentProducts.join(', ')}

Generate advice for category: "${category}"

Provide response as JSON with this exact structure:
{
  "mainAdvice": {
    "title": "Main actionable advice title (max 60 chars)",
    "content": "Detailed advice explanation (100-200 words)",
    "category": "${category}",
    "priority": "high/medium/low",
    "actionSteps": ["step 1", "step 2", "step 3"],
    "expectedBenefit": "What the shop owner will gain"
  },
  "quickTips": [
    {
      "title": "Quick tip 1 title",
      "content": "Brief tip (30-50 words)",
      "icon": "appropriate emoji",
      "timeToImplement": "5 minutes/1 hour/etc"
    },
    {
      "title": "Quick tip 2 title", 
      "content": "Brief tip (30-50 words)",
      "icon": "appropriate emoji",
      "timeToImplement": "5 minutes/1 hour/etc"
    },
    {
      "title": "Quick tip 3 title",
      "content": "Brief tip (30-50 words)", 
      "icon": "appropriate emoji",
      "timeToImplement": "5 minutes/1 hour/etc"
    }
  ],
  "contextualInsight": {
    "title": "Time/season specific insight",
    "content": "Why this advice is relevant right now (50-100 words)",
    "urgency": "immediate/today/this_week"
  }
}

Focus on:
- Practical, actionable advice for Indian retail context
- Time-appropriate suggestions (morning/evening/weekend strategies)
- Seasonal relevance (summer drinks, winter items, monsoon preparations)
- Stock optimization based on current inventory
- Customer psychology for Indian shoppers
- Quick wins that can be implemented immediately

Make the advice specific to the current time and business context. Use clear, simple language suitable for shop owners.`;

    return basePrompt;
  }

  fallbackAdvice(category, timeContext) {
    const fallbackData = {
      mainAdvice: {
        title: `${timeContext.timeOfDay} Business Strategy`,
        content: `During ${timeContext.timeOfDay} hours on a ${timeContext.dayType}, focus on customer service excellence and maintaining well-organized displays. This is the foundation of successful retail business.`,
        category: category || 'general',
        priority: 'medium',
        actionSteps: [
          'Check and organize product displays',
          'Ensure clear pricing on all items',
          'Greet customers warmly and offer assistance'
        ],
        expectedBenefit: 'Improved customer experience and increased sales'
      },
      quickTips: [
        {
          title: 'Clean Shop Front',
          content: 'Wipe down surfaces and arrange entrance display attractively.',
          icon: '✨',
          timeToImplement: '5 minutes'
        },
        {
          title: 'Check Popular Items',
          content: 'Ensure fast-moving products are well-stocked and visible.',
          icon: '📦',
          timeToImplement: '10 minutes'
        },
        {
          title: 'Customer Greeting',
          content: 'Smile and ask "How can I help you today?" to each customer.',
          icon: '😊',
          timeToImplement: '0 minutes'
        }
      ],
      contextualInsight: {
        title: 'Current Time Focus',
        content: `${timeContext.timeOfDay.charAt(0).toUpperCase() + timeContext.timeOfDay.slice(1)} is a good time to focus on customer engagement and shop presentation.`,
        urgency: 'immediate'
      }
    };

    return fallbackData;
  }

  async generateMarketTrendAdvice(userId) {
    try {
      const profile = await BusinessProfile.findOne({ userId });
      const currentDate = new Date();
      
      const prompt = `Generate market trend advice for a ${profile?.vendorType || 'retail'} shop in India. 
      Current date: ${currentDate.toDateString()}
      
      Provide JSON response with current market trends, seasonal demands, and business opportunities:
      {
        "marketTrends": {
          "title": "Current Market Trend",
          "content": "Description of current market situation",
          "impact": "How it affects small retailers"
        },
        "seasonalDemand": {
          "title": "Seasonal Opportunity",
          "products": ["product1", "product2", "product3"],
          "strategy": "How to capitalize on seasonal demand"
        },
        "competitiveEdge": {
          "title": "Competitive Advantage",
          "content": "How to stay ahead of competition",
          "actionItems": ["action1", "action2"]
        }
      }`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const trendsData = JSON.parse(response.text());

      return {
        success: true,
        trends: trendsData,
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Market trend advice error:', error);
      return {
        success: false,
        trends: {
          marketTrends: {
            title: 'Focus on Basics',
            content: 'Maintain good customer service and product quality.',
            impact: 'Strong fundamentals always work in retail.'
          },
          seasonalDemand: {
            title: 'Regular Essentials',
            products: ['milk', 'bread', 'rice'],
            strategy: 'Keep daily essentials well-stocked.'
          },
          competitiveEdge: {
            title: 'Personal Service',
            content: 'Build relationships with regular customers.',
            actionItems: ['Remember customer names', 'Offer personalized suggestions']
          }
        },
        generatedAt: new Date(),
        error: 'Using fallback trends due to service error'
      };
    }
  }
}

module.exports = new GeminiDailyAdvice();