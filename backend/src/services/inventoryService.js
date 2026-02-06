const InventoryItem = require('../models/InventoryItem');

class InventoryService {
  // Calculate stock status
  static calculateStockStatus(item) {
    if (item.quantity <= 0) {
      return 'OUT_OF_STOCK';
    } else if (item.quantity <= item.minStockLevel) {
      return 'LOW_STOCK';
    } else {
      return 'SAFE';
    }
  }

  // Calculate expiry status
  static calculateExpiryStatus(expiryDate) {
    if (!expiryDate) return null;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'EXPIRED';
    } else if (diffDays <= 3) {
      return 'NEAR_EXPIRY';
    } else {
      return 'FRESH';
    }
  }

  // Get all inventory items for a business with enhanced data
  static async getInventory(businessId) {
    const items = await InventoryItem.find({ businessId }).sort({ productName: 1 });
    
    const enhancedItems = items.map(item => {
      const stockStatus = this.calculateStockStatus(item);
      const expiryStatus = this.calculateExpiryStatus(item.expiryDate);
      const margin = this.calculateMargin(item);
      const priceWarnings = this.getPriceWarnings(item);
      
      return {
        _id: item._id,
        productName: item.productName,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minStockLevel: item.minStockLevel,
        expiryDate: item.expiryDate,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        mrp: item.mrp,
        lastPriceUpdatedAt: item.lastPriceUpdatedAt,
        stockStatus,
        expiryStatus,
        pricingComplete: !!(item.costPrice && item.sellingPrice),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        // Enhanced features
        margin,
        priceWarnings,
        goodForOffer: this.isGoodForOffer(item),
        fastMoving: false // Will be calculated separately based on activity
      };
    });

    // Calculate health score and summary
    const healthScore = this.calculateHealthScore(items);
    const healthSummary = this.generateHealthSummary(items);
    
    // Generate today's tasks
    const todaysTasks = this.generateTodaysTasks(items);
    
    // Get day-aware hint
    const dayHint = this.getDayAwareHint();

    return {
      items: enhancedItems,
      healthScore,
      healthSummary,
      todaysTasks,
      dayHint,
      count: enhancedItems.length
    };
  }

  // Get low stock alerts
  static async getLowStockAlerts(businessId) {
    const items = await InventoryItem.find({ businessId });
    
    const alerts = items.filter(item => {
      const status = this.calculateStockStatus(item);
      return status === 'LOW_STOCK' || status === 'OUT_OF_STOCK';
    }).map(item => ({
      _id: item._id,
      productName: item.productName,
      quantity: item.quantity,
      unit: item.unit,
      stockStatus: this.calculateStockStatus(item)
    }));

    return alerts;
  }

  // Calculate inventory health score (0-100)
  static calculateHealthScore(items) {
    let score = 100;
    
    items.forEach(item => {
      const stockStatus = this.calculateStockStatus(item);
      const expiryStatus = this.calculateExpiryStatus(item.expiryDate);
      
      if (stockStatus === 'OUT_OF_STOCK') {
        score -= 10;
      } else if (stockStatus === 'LOW_STOCK') {
        score -= 5;
      }
      
      if (expiryStatus === 'EXPIRED' || expiryStatus === 'NEAR_EXPIRY') {
        score -= 5;
      }
    });
    
    return Math.max(0, score);
  }

  // Generate health score summary
  static generateHealthSummary(items) {
    const outOfStockCount = items.filter(item => this.calculateStockStatus(item) === 'OUT_OF_STOCK').length;
    const lowStockCount = items.filter(item => this.calculateStockStatus(item) === 'LOW_STOCK').length;
    const expiredCount = items.filter(item => this.calculateExpiryStatus(item.expiryDate) === 'EXPIRED').length;
    const nearExpiryCount = items.filter(item => this.calculateExpiryStatus(item.expiryDate) === 'NEAR_EXPIRY').length;
    
    const parts = [];
    
    if (lowStockCount > 0) parts.push(`${lowStockCount} low stock`);
    if (outOfStockCount > 0) parts.push(`${outOfStockCount} out of stock`);
    if (expiredCount > 0) parts.push(`${expiredCount} expired`);
    else if (nearExpiryCount > 0) parts.push(`${nearExpiryCount} near expiry`);
    else parts.push('No expired items');
    
    return parts.join(' · ');
  }

  // Calculate profit margin
  static calculateMargin(item) {
    if (!item.costPrice || !item.sellingPrice) return null;
    
    const margin = item.sellingPrice - item.costPrice;
    const marginPercentage = ((margin / item.costPrice) * 100).toFixed(1);
    
    return {
      margin: margin.toFixed(2),
      marginPercentage: parseFloat(marginPercentage),
      status: marginPercentage >= 15 ? 'good' : marginPercentage >= 5 ? 'fair' : 'poor'
    };
  }

  // Detect smart price warnings
  static getPriceWarnings(item) {
    const warnings = [];
    
    if (item.costPrice && item.sellingPrice) {
      if (item.sellingPrice < item.costPrice) {
        warnings.push('Selling below cost price');
      }
      if (item.sellingPrice === item.costPrice) {
        warnings.push('No profit margin');
      }
    }
    
    if (item.sellingPrice && item.mrp && item.sellingPrice > item.mrp) {
      warnings.push('Selling above MRP');
    }
    
    return warnings;
  }

  // Check if product is good for offer
  static isGoodForOffer(item) {
    const margin = this.calculateMargin(item);
    const nearExpiry = this.calculateExpiryStatus(item.expiryDate) === 'NEAR_EXPIRY';
    
    // High margin and good stock
    if (margin && margin.marginPercentage >= 15 && item.quantity > item.minStockLevel * 2) {
      return true;
    }
    
    // Near expiry with some margin
    if (nearExpiry && margin && margin.marginPercentage > 0) {
      return true;
    }
    
    return false;
  }

  // Generate today's inventory tasks
  static generateTodaysTasks(items) {
    const tasks = [];
    const maxTasks = 5;
    
    // Priority 1: Out of stock items
    items
      .filter(item => this.calculateStockStatus(item) === 'OUT_OF_STOCK')
      .slice(0, 2)
      .forEach(item => {
        tasks.push({
          type: 'restock',
          product: item.productName,
          task: `Restock ${item.productName}`,
          priority: 'high'
        });
      });
    
    // Priority 2: Low stock items
    items
      .filter(item => this.calculateStockStatus(item) === 'LOW_STOCK')
      .slice(0, Math.min(3, maxTasks - tasks.length))
      .forEach(item => {
        tasks.push({
          type: 'restock',
          product: item.productName,
          task: `Restock ${item.productName}`,
          priority: 'medium'
        });
      });
    
    // Priority 3: Near expiry items
    items
      .filter(item => this.calculateExpiryStatus(item.expiryDate) === 'NEAR_EXPIRY')
      .slice(0, Math.min(2, maxTasks - tasks.length))
      .forEach(item => {
        tasks.push({
          type: 'discount',
          product: item.productName,
          task: `Discount or move ${item.productName}`,
          priority: 'medium'
        });
      });
    
    return tasks.slice(0, maxTasks);
  }

  // Generate day-aware inventory hint
  static getDayAwareHint() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = now.getDate();
    
    // Weekend hints
    if (dayOfWeek === 6 || dayOfWeek === 0) { // Saturday or Sunday
      return 'Weekend rush expected - ensure snacks and beverages are well-stocked';
    }
    
    // Month-end hints
    if (dayOfMonth >= 25) {
      return 'Month-end period - consider promoting premium items';
    }
    
    // Weekday hints
    return 'Weekday operations - focus on daily essentials and regular items';
  }

  // Generate basic insights
  static async getInventoryInsights(businessId) {
    const items = await InventoryItem.find({ businessId });
    const insights = [];

    if (items.length === 0) {
      return ['No inventory items found. Start adding products to get insights.'];
    }

    // Low stock items insight
    const lowStockItems = items.filter(item => this.calculateStockStatus(item) === 'LOW_STOCK');
    const outOfStockItems = items.filter(item => this.calculateStockStatus(item) === 'OUT_OF_STOCK');

    if (outOfStockItems.length > 0) {
      insights.push(`${outOfStockItems.length} item(s) are completely out of stock.`);
    }

    if (lowStockItems.length > 0) {
      insights.push(`${lowStockItems.length} item(s) are running low on stock.`);
    }

    // Most stocked categories
    const categoryStats = {};
    items.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, totalQuantity: 0 };
      }
      categoryStats[category].count++;
      categoryStats[category].totalQuantity += item.quantity;
    });

    const sortedCategories = Object.entries(categoryStats)
      .sort((a, b) => b[1].count - a[1].count);

    if (sortedCategories.length > 0) {
      const topCategory = sortedCategories[0];
      insights.push(`${topCategory[0]} category has the most items (${topCategory[1].count} products).`);
    }

    // Expiry insights
    const nearExpiryItems = items.filter(item => 
      this.calculateExpiryStatus(item.expiryDate) === 'NEAR_EXPIRY'
    );
    const expiredItems = items.filter(item => 
      this.calculateExpiryStatus(item.expiryDate) === 'EXPIRED'
    );

    if (expiredItems.length > 0) {
      insights.push(`${expiredItems.length} item(s) have expired and need attention.`);
    }

    if (nearExpiryItems.length > 0) {
      insights.push(`${nearExpiryItems.length} item(s) are expiring within 3 days.`);
    }

    if (insights.length === 0) {
      insights.push('Your inventory looks healthy! All items are well-stocked.');
    }

    return insights;
  }
}

module.exports = InventoryService;
