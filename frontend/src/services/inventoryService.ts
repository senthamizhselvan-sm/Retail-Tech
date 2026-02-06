import api from './api';

export interface InventoryItem {
  _id: string;
  productName: string;
  category?: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  expiryDate?: string;
  // Pricing fields added for AI-based offer planning
  costPrice?: number;
  sellingPrice?: number;
  mrp?: number;
  lastPriceUpdatedAt?: string;
  stockStatus: 'SAFE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  expiryStatus?: 'FRESH' | 'NEAR_EXPIRY' | 'EXPIRED';
  pricingComplete?: boolean;
  createdAt: string;
  updatedAt: string;
  // Enhanced features
  margin?: {
    margin: string;
    marginPercentage: number;
    status: 'good' | 'fair' | 'poor';
  };
  priceWarnings?: string[];
  goodForOffer?: boolean;
  fastMoving?: boolean;
}

export interface AddProductData {
  productName: string;
  category?: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  expiryDate?: string;
  // Optional pricing fields
  costPrice?: number;
  sellingPrice?: number;
  mrp?: number;
}

export interface UpdateQuantityData {
  delta: number;
  source?: 'manual' | 'voice' | 'basket';
}

export interface UpdateProductData {
  productName?: string;
  category?: string;
  unit?: string;
  minStockLevel?: number;
  expiryDate?: string;
  costPrice?: number;
  sellingPrice?: number;
  mrp?: number;
}

export interface LowStockAlert {
  _id: string;
  productName: string;
  quantity: number;
  unit: string;
  stockStatus: 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface InventoryTask {
  type: 'restock' | 'discount';
  product: string;
  task: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ActivityLog {
  type: 'add' | 'reduce' | 'create' | 'undo';
  productName: string;
  quantityChange: number;
  source: 'manual' | 'voice' | 'undo' | 'basket';
  timestamp: string;
  unit: string;
}

export interface EnhancedInventoryResponse {
  data: InventoryItem[];
  healthScore: number;
  healthSummary: string;
  todaysTasks: InventoryTask[];
  dayHint: string;
  count: number;
  activityLogs?: ActivityLog[];
  hasUndoAction?: boolean;
}

class InventoryService {
  // Get all inventory items with enhanced data
  async getInventory(): Promise<EnhancedInventoryResponse> {
    const response = await api.get('/inventory');
    return response.data;
  }

  // Add a new product
  async addProduct(productData: AddProductData): Promise<InventoryItem> {
    const response = await api.post('/inventory', productData);
    return response.data.data;
  }

  // Update product quantity with enhanced response
  async updateQuantity(productId: string, delta: number, source: 'manual' | 'voice' | 'basket' = 'manual'): Promise<any> {
    const response = await api.put(`/inventory/${productId}`, { delta, source });
    return response.data;
  }

  // Update product details including pricing
  async updateProduct(productId: string, updateData: UpdateProductData): Promise<InventoryItem> {
    const response = await api.patch(`/inventory/${productId}`, updateData);
    return response.data.data;
  }

  // Delete a product
  async deleteProduct(productId: string): Promise<void> {
    await api.delete(`/inventory/${productId}`);
  }

  // Get low stock alerts
  async getLowStockAlerts(): Promise<LowStockAlert[]> {
    const response = await api.get('/inventory/alerts');
    return response.data.data;
  }

  // Get inventory insights
  async getInventoryInsights(): Promise<string[]> {
    const response = await api.get('/inventory/insights');
    return response.data.data;
  }

  // Voice command processing - simplified (backend handles language detection)
  async processVoiceCommand(command: string, language?: 'english' | 'tamil') {
    try {
      const response = await api.post(
        '/inventory/voice-command',
        {
          command,
          // Language is optional - backend auto-detects
          ...(language && { language })
        },
        {
          timeout: 15000 // 15 second timeout for AI processing
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Voice command service error:', error);

      // Enhanced error messages
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - AI is taking too long. Try again.');
      } else if (error.response?.status === 404) {
        throw new Error('Voice command endpoint not found. Check if backend is running.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw error;
    }
  }

  // Get activity logs
  async getActivityLogs(): Promise<ActivityLog[]> {
    const response = await api.get('/inventory/activity-logs');
    return response.data.data;
  }

  // Undo last inventory action
  async undoLastAction(): Promise<any> {
    const response = await api.post('/inventory/undo');
    return response.data;
  }

  // NEW: Basket-specific methods
  
  // Process basket action (delivery or sale)
  async processBasketAction(action: any): Promise<any> {
    const response = await api.post('/inventory/basket', action);
    return response.data;
  }

  // Convert basket to inventory update
  async convertBasketToUpdate(basketItems: any[], type: 'incoming' | 'outgoing'): Promise<any> {
    const response = await api.post('/inventory/basket/convert', {
      items: basketItems,
      type
    });
    return response.data;
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;