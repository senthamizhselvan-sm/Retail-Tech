const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface GeminiAdviceResponse {
  success: boolean;
  data: {
    success: boolean;
    advice: {
      mainAdvice: {
        title: string;
        content: string;
        category: string;
        priority: 'high' | 'medium' | 'low';
        actionSteps: string[];
        expectedBenefit: string;
      };
      quickTips: Array<{
        title: string;
        content: string;
        icon: string;
        timeToImplement: string;
      }>;
      contextualInsight: {
        title: string;
        content: string;
        urgency: 'immediate' | 'today' | 'this_week';
      };
    };
    generatedAt: string;
    context: {
      timeOfDay: string;
      dayType: string;
      shopType: string;
    };
    error?: string;
  };
  message: string;
}

interface MarketTrendsResponse {
  success: boolean;
  data: {
    success: boolean;
    trends: {
      marketTrends: {
        title: string;
        content: string;
        impact: string;
      };
      seasonalDemand: {
        title: string;
        products: string[];
        strategy: string;
      };
      competitiveEdge: {
        title: string;
        content: string;
        actionItems: string[];
      };
    };
    generatedAt: string;
    error?: string;
  };
  message: string;
}

interface ComprehensiveInsightsResponse {
  success: boolean;
  data: {
    advice: GeminiAdviceResponse['data'];
    trends: MarketTrendsResponse['data'];
    profile: {
      shopName: string;
      vendorType: string;
      location: string;
    };
    generatedAt: string;
  };
  message: string;
}

export const dailyAssistantService = {
  // Get Gemini-powered real-time advice
  async getGeminiAdvice(category = 'all'): Promise<GeminiAdviceResponse> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/assistant/gemini/advice?category=${category}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get market trend advice
  async getMarketTrends(): Promise<MarketTrendsResponse> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/assistant/gemini/trends`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get comprehensive insights (advice + trends)
  async getComprehensiveInsights(): Promise<ComprehensiveInsightsResponse> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/assistant/gemini/comprehensive`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Legacy route for today's insights
  async getTodayInsights() {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/assistant/today`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};

export type {
  GeminiAdviceResponse,
  MarketTrendsResponse,
  ComprehensiveInsightsResponse
};