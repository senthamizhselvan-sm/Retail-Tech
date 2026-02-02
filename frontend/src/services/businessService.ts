import api from './api';

export interface BusinessHealthData {
  businessHealth: 'high' | 'normal' | 'low';
  salesTrend: 'up' | 'stable' | 'down';
  priceStatus: 'competitive' | 'premium' | 'mixed';
  offerFreshness: 'fresh' | 'aging' | 'stale';
  lastUpdated: string;
}

export interface BusinessProfile {
  userId: string;
  shopName: string;
  vendorType: 'kirana' | 'clothing' | 'electronics' | 'food_beverages' | 'general_store' | 'other';
  address: {
    street: string;
    city: string;
    state: string;
    pinCode: string;
  };
  phoneNumber: string;
  whatsappNumber: string;
  email: string;
  operatingDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  businessHours: {
    openingTime: string;
    closingTime: string;
    is24x7: boolean;
  };
  logoUrl: string;
  shopPhotoUrl: string;
  shopDescription: string;
  establishedYear?: number;
  gstNumber: string;
  preferredLanguage: string;
  themeColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  profile: BusinessProfile;
  healthIndicators: BusinessHealthData;
  todayInsights: any[];
  recentReflection: any;
  competitorPrices: any[];
  growthProgress: {
    stage: string;
    totalScore: number;
    badges: string[];
  };
}

export interface VoiceSummary {
  text: string;
  health: string;
  trend: string;
}

class BusinessService {
  // Get complete business dashboard data
  static async getDashboard(): Promise<DashboardData> {
    const response = await api.get('/business/dashboard');
    return response.data.dashboard;
  }

  // Get business health indicators
  static async getBusinessHealth(): Promise<BusinessHealthData> {
    const response = await api.get('/business/health');
    return response.data.health;
  }

  // Get voice summary
  static async getVoiceSummary(): Promise<VoiceSummary> {
    const response = await api.get('/business/summary');
    return response.data.summary;
  }

  // Get business profile
  static async getProfile(): Promise<BusinessProfile> {
    const response = await api.get('/business-profile');
    return response.data.profile;
  }

  // Update business profile
  static async updateProfile(profileData: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const response = await api.put('/business-profile', profileData);
    return response.data.profile;
  }

  // Upload shop logo
  static async uploadLogo(imageData: string): Promise<string> {
    const response = await api.post('/business-profile/upload-logo', { imageData });
    return response.data.logoUrl;
  }

  // Upload shop photo
  static async uploadShopPhoto(imageData: string): Promise<string> {
    const response = await api.post('/business-profile/upload-shop-photo', { imageData });
    return response.data.shopPhotoUrl;
  }

  // Remove logo
  static async removeLogo(): Promise<void> {
    await api.delete('/business-profile/logo');
  }

  // Remove shop photo
  static async removeShopPhoto(): Promise<void> {
    await api.delete('/business-profile/shop-photo');
  }
}

export default BusinessService;