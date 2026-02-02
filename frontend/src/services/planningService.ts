import api from './api';

export interface PricingData {
  costPrice?: number;
  sellingPrice?: number;
  mrp?: number;
}

export interface ProductPricing {
  costPrice: number;
  sellingPrice?: number;
  mrp?: number;
}

export interface OfferRecommendation {
  product: string;
  marketTrend: string;
  recommendedDiscount: string;
  finalPrice: number | null;
  marginStatus: 'SAFE' | 'RISKY' | 'NOT RECOMMENDED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
}

export interface ProductOfferData {
  productId: string;
  productName: string;
  category?: string;
  currentQuantity: number;
  stockStatus: 'SAFE' | 'LOW';
  pricing: ProductPricing;
  recommendation: OfferRecommendation;
  lastPriceUpdated?: string;
}

export interface MarketInsight {
  category: string;
  insight: string;
  dayOfWeek: string;
  monthName: string;
  isSalaryTime: boolean;
  isWeekend: boolean;
  generatedAt: string;
  fallback?: boolean;
}

export interface OfferRecommendationsResponse {
  success: boolean;
  data: ProductOfferData[];
  marketInsight: MarketInsight;
  summary: {
    totalProducts: number;
    productsWithOffers: number;
    safeOffers: number;
    riskyOffers: number;
  };
  hasData: boolean;
  generatedAt: string;
  message: string;
}

export interface SingleProductOfferResponse {
  success: boolean;
  data: ProductOfferData;
  generatedAt: string;
  message: string;
}

class PlanningService {
  /**
   * Get AI-powered offer recommendations for all products
   */
  async getOfferRecommendations(category?: string): Promise<OfferRecommendationsResponse> {
    try {
      const params = category ? `?category=${encodeURIComponent(category)}` : '';
      const response = await api.get(`/planning/offers${params}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get offer recommendations:', error);
      throw new Error(error.response?.data?.message || 'Failed to load offer recommendations');
    }
  }

  /**
   * Get offer recommendation for a single product
   */
  async getProductOfferRecommendation(productId: string): Promise<SingleProductOfferResponse> {
    try {
      const response = await api.get(`/planning/offers/${productId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get product offer recommendation:', error);
      throw new Error(error.response?.data?.message || 'Failed to load product offer recommendation');
    }
  }

  /**
   * Update product pricing data
   */
  async updateProductPricing(productId: string, pricingData: PricingData): Promise<any> {
    try {
      // Import inventory service dynamically to avoid circular imports
      const inventoryService = (await import('./inventoryService')).default;
      const response = await inventoryService.updateProduct(productId, pricingData);
      return response;
    } catch (error: any) {
      console.error('Failed to update product pricing:', error);
      throw new Error(error.response?.data?.message || 'Failed to update pricing');
    }
  }

  /**
   * Get existing calendar and planning data
   */
  async getMonthlyCalendar(year?: number, month?: number): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (month !== undefined) params.append('month', month.toString());
      
      const response = await api.get(`/planning/calendar?${params}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get monthly calendar:', error);
      throw new Error(error.response?.data?.message || 'Failed to load calendar');
    }
  }

  /**
   * Format offer recommendation for display
   */
  formatOfferRecommendation(recommendation: OfferRecommendation): string {
    if (recommendation.finalPrice === null) {
      return `No discount recommended: ${recommendation.reason}`;
    }

    return `${recommendation.recommendedDiscount} discount (Final: ₹${recommendation.finalPrice}) - ${recommendation.reason}`;
  }

  /**
   * Get risk level color for UI display
   */
  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'LOW': return '#10B981'; // green
      case 'MEDIUM': return '#F59E0B'; // yellow
      case 'HIGH': return '#EF4444'; // red
      default: return '#6B7280'; // gray
    }
  }

  /**
   * Get margin status color for UI display
   */
  getMarginStatusColor(marginStatus: string): string {
    switch (marginStatus) {
      case 'SAFE': return '#10B981'; // green
      case 'RISKY': return '#F59E0B'; // yellow
      case 'NOT RECOMMENDED': return '#EF4444'; // red
      default: return '#6B7280'; // gray
    }
  }

  /**
   * Check if product has complete pricing data
   */
  hasCompletePricing(pricing: ProductPricing): boolean {
    return !!(pricing.costPrice && pricing.costPrice > 0);
  }

  /**
   * Validate pricing data before sending
   */
  validatePricingData(pricingData: PricingData): { isValid: boolean; error?: string } {
    const { costPrice, sellingPrice, mrp } = pricingData;

    if (costPrice !== undefined && costPrice <= 0) {
      return { isValid: false, error: 'Cost price must be greater than 0' };
    }

    if (sellingPrice !== undefined && sellingPrice <= 0) {
      return { isValid: false, error: 'Selling price must be greater than 0' };
    }

    if (mrp !== undefined && mrp <= 0) {
      return { isValid: false, error: 'MRP must be greater than 0' };
    }

    if (costPrice && sellingPrice && sellingPrice < costPrice) {
      return { isValid: false, error: 'Selling price cannot be less than cost price' };
    }

    if (sellingPrice && mrp && sellingPrice > mrp) {
      return { isValid: false, error: 'Selling price cannot be more than MRP' };
    }

    return { isValid: true };
  }
}

export default new PlanningService();