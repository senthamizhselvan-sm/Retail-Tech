const DailyInsight = require('../models/DailyInsight');
const BusinessProfile = require('../models/BusinessProfile');

class InsightEngine {
  
  // Generate daily insights based on date and business profile
  static async generateDailyInsights(userId, date) {
    try {
      const profile = await BusinessProfile.findOne({ userId });
      const dayOfWeek = new Date(date).getDay();
      const month = new Date(date).getMonth();
      
      const insights = [];
      
      // Weekend vs Weekday insights
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        insights.push({
          userId,
          date,
          insightText: 'Weekend brings family shoppers. Stock snacks, cold drinks, and household items prominently.',
          insightType: 'weekday',
          priority: 'high',
          category: 'stock'
        });
      } else {
        insights.push({
          userId,
          date,
          insightText: 'Weekday focus on essentials. Keep milk, bread, and daily needs at eye level.',
          insightType: 'weekday',
          priority: 'medium',
          category: 'stock'
        });
      }
      
      // Seasonal insights
      if (month >= 3 && month <= 6) { // Summer months
        insights.push({
          userId,
          date,
          insightText: 'Summer season: Highlight cold drinks, ice cream, and cooling products near entrance.',
          insightType: 'seasonal',
          priority: 'high',
          category: 'visibility'
        });
      } else if (month >= 10 || month <= 1) { // Winter months
        insights.push({
          userId,
          date,
          insightText: 'Winter season: Promote hot beverages, warm snacks, and comfort foods.',
          insightType: 'seasonal',
          priority: 'medium',
          category: 'stock'
        });
      }
      
      // Festival insights (simplified calendar)
      const festivalInsights = this.getFestivalInsights(date, profile?.vendorType);
      if (festivalInsights) {
        insights.push(festivalInsights);
      }
      
      // Business psychology tips
      insights.push({
        userId,
        date,
        insightText: 'Greet customers with a smile. Ask "What do you need today?" instead of waiting silently.',
        insightType: 'general',
        priority: 'medium',
        category: 'psychology'
      });
      
      return insights;
      
    } catch (error) {
      console.error('Error generating daily insights:', error);
      return [];
    }
  }
  
  // Get festival-specific insights
  static getFestivalInsights(date, vendorType = 'kirana') {
    const month = new Date(date).getMonth();
    const day = new Date(date).getDate();
    
    // Simplified festival calendar
    const festivals = {
      0: { // January
        26: { name: 'Republic Day', insight: 'National holiday brings families out. Stock patriotic decorations and sweets.' }
      },
      2: { // March
        8: { name: 'Holi', insight: 'Holi celebration! Stock colors, sweets, and festive snacks. High demand expected.' }
      },
      7: { // August
        15: { name: 'Independence Day', insight: 'Independence Day! Display tricolor items and traditional sweets prominently.' }
      },
      9: { // October
        2: { name: 'Gandhi Jayanti', insight: 'Gandhi Jayanti holiday. Expect moderate footfall, focus on essentials.' }
      },
      10: { // November - Diwali season
        12: { name: 'Diwali', insight: 'Diwali festival! Peak season for sweets, decorations, and gift items. Stock heavily.' }
      }
    };
    
    if (festivals[month] && festivals[month][day]) {
      const festival = festivals[month][day];
      return {
        date,
        insightText: festival.insight,
        insightType: 'festival',
        priority: 'high',
        category: 'stock'
      };
    }
    
    return null;
  }
  
  // Get insights for a specific user and date range
  static async getInsightsForDateRange(userId, startDate, endDate) {
    try {
      return await DailyInsight.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 });
    } catch (error) {
      console.error('Error fetching insights for date range:', error);
      return [];
    }
  }
  
  // Mark insight as read
  static async markInsightAsRead(insightId) {
    try {
      return await DailyInsight.findByIdAndUpdate(
        insightId,
        { isRead: true },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking insight as read:', error);
      return null;
    }
  }

  // Generate daily advice
  static async generateDailyAdvice(userId, profile) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const month = today.getMonth();
    
    const advice = {
      greeting: this.getGreeting(profile?.preferredLanguage || 'en'),
      mainAdvice: this.getMainAdvice(dayOfWeek, month, profile?.vendorType),
      tips: this.getDailyTips(profile?.vendorType),
      weather: this.getWeatherAdvice(month),
      timing: this.getTimingAdvice(dayOfWeek)
    };
    
    return advice;
  }

  // Generate contextual tips
  static async generateContextualTips(userId, profile) {
    const tips = [
      'Keep your shop clean and well-organized',
      'Greet customers warmly when they enter',
      'Display popular items at eye level',
      'Keep change ready for smooth transactions',
      'Ask customers about their needs proactively',
      'Maintain consistent opening hours',
      'Stock items based on local events and festivals',
      'Build relationships with regular customers',
      'Keep prices clearly visible',
      'Offer small samples of new products'
    ];
    
    // Add business-specific tips
    if (profile?.vendorType === 'grocery') {
      tips.push('Keep fruits and vegetables fresh and visible');
      tips.push('Organize items by categories for easy shopping');
    } else if (profile?.vendorType === 'clothing') {
      tips.push('Display new arrivals prominently');
      tips.push('Keep different sizes organized and accessible');
    }
    
    // Return 3 random tips
    const shuffled = tips.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  // Helper methods
  static getGreeting(language) {
    const greetings = {
      en: 'Good morning! Here\'s your daily business advice.',
      ta: 'வணக்கம்! இன்றைய வணிக ஆலோசனை இங்கே.',
      hi: 'नमस्ते! आज की व्यापारिक सलाह यहाँ है।'
    };
    return greetings[language] || greetings.en;
  }

  static getMainAdvice(dayOfWeek, month, vendorType) {
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'Weekend brings more family customers. Focus on household items, snacks, and convenience products.';
    } else if (dayOfWeek === 1) {
      return 'Monday fresh start! Ensure your shop is well-stocked and organized for the week ahead.';
    } else {
      return 'Weekday routine: Focus on essentials and maintain good customer service for regular customers.';
    }
  }

  static getDailyTips(vendorType) {
    const tips = {
      kirana: [
        'Keep milk and bread easily accessible',
        'Display seasonal fruits prominently',
        'Maintain cold storage for perishables'
      ],
      clothing: [
        'Display new arrivals at the entrance',
        'Keep popular sizes readily available',
        'Maintain good lighting for fabric visibility'
      ],
      rural: [
        'Stock agricultural supplies during farming season',
        'Keep basic medicines and first aid items',
        'Maintain good relationships with local farmers'
      ]
    };
    
    return tips[vendorType] || tips.kirana;
  }

  static getWeatherAdvice(month) {
    if (month >= 3 && month <= 6) {
      return 'Summer season: Stock cooling products, cold drinks, and summer essentials.';
    } else if (month >= 10 || month <= 1) {
      return 'Winter season: Promote warm beverages, comfort foods, and winter clothing.';
    } else {
      return 'Monsoon season: Stock umbrellas, raincoats, and indoor entertainment items.';
    }
  }

  static getTimingAdvice(dayOfWeek) {
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'Weekend: Consider extended hours as families shop together.';
    } else {
      return 'Weekday: Peak hours are morning (7-9 AM) and evening (6-8 PM).';
    }
  }
}

module.exports = InsightEngine;
