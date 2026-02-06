// ULTRA SIMPLE - No complex logic

export interface BasketItem {
  productId: string;
  productName: string;
  icon: string;
  quantity: number;
  unit: string;
  currentStock: number;
}

export interface BasketAction {
  type: 'add_stock' | 'sell_stock';
  items: BasketItem[];
  timestamp: Date;
}

export class SimpleBasketHelpers {
  // Simple validation - just check quantities
  static validateAction(action: BasketAction, inventory: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const item of action.items) {
      const product = inventory.find(p => p._id === item.productId);
      
      if (!product) {
        errors.push(`${item.productName} not found`);
        continue;
      }

      // For sales, check if enough stock
      if (action.type === 'sell_stock' && item.quantity > product.quantity) {
        errors.push(`Not enough ${item.productName} (only ${product.quantity} left)`);
      }

      // Check if quantity is valid
      if (item.quantity <= 0) {
        errors.push(`Invalid quantity for ${item.productName}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Simple conversion to inventory updates
  static convertToUpdates(action: BasketAction): Array<{
    productId: string;
    quantityDelta: number;
  }> {
    return action.items.map(item => ({
      productId: item.productId,
      quantityDelta: action.type === 'add_stock' ? item.quantity : -item.quantity
    }));
  }

  // Simple success messages
  static getSuccessMessage(action: BasketAction): string {
    const itemCount = action.items.length;
    const totalItems = action.items.reduce((sum, item) => sum + item.quantity, 0);

    if (action.type === 'add_stock') {
      return `✅ Added ${totalItems} items from supplier (${itemCount} products)`;
    } else {
      return `💰 Sale recorded: ${totalItems} items sold (${itemCount} products)`;
    }
  }

  // Simple icons for products
  static getProductIcon(productName: string): string {
    const name = productName.toLowerCase();
    
    if (name.includes('rice') || name.includes('அரிசி')) return '🍚';
    if (name.includes('soap') || name.includes('சோப்')) return '🧼';
    if (name.includes('milk') || name.includes('பால்')) return '🥛';
    if (name.includes('oil') || name.includes('எண்ணெய்')) return '🛢️';
    if (name.includes('sugar') || name.includes('சர்க்கரை')) return '🍬';
    if (name.includes('salt') || name.includes('உப்பு')) return '🧂';
    if (name.includes('battery') || name.includes('பேட்டரி')) return '🔋';
    if (name.includes('biscuit') || name.includes('பிஸ்கட்')) return '🍪';
    if (name.includes('tea') || name.includes('டீ')) return '🍵';
    if (name.includes('coffee') || name.includes('காபி')) return '☕';
    if (name.includes('dal') || name.includes('பருப்பு')) return '🫘';
    if (name.includes('spice') || name.includes('மசாலா')) return '🌶️';
    if (name.includes('bread') || name.includes('பிரெட்')) return '🍞';
    if (name.includes('egg') || name.includes('முட்டை')) return '🥚';
    if (name.includes('onion') || name.includes('வெங்காயம்')) return '🧅';
    if (name.includes('potato') || name.includes('உருளைக்கிழங்கு')) return '🥔';
    if (name.includes('tomato') || name.includes('தக்காளி')) return '🍅';
    if (name.includes('banana') || name.includes('வாழைப்பழம்')) return '🍌';
    if (name.includes('apple') || name.includes('ஆப்பிள்')) return '🍎';
    if (name.includes('orange') || name.includes('ஆரஞ்சு')) return '🍊';
    
    return '📦';
  }

  // Simple stock indicator
  static getStockLevel(quantity: number, minStock: number): 'good' | 'low' | 'empty' {
    if (quantity === 0) return 'empty';
    if (quantity <= minStock) return 'low';
    return 'good';
  }

  // Simple voice commands
  static parseVoiceCommand(command: string): {
    type: 'supplier' | 'customer' | 'add' | 'sell' | null;
    product: string | null;
    quantity: number;
  } {
    const lower = command.toLowerCase();
    const tamil = /[\u0B80-\u0BFF]/.test(command);

    let type: 'supplier' | 'customer' | 'add' | 'sell' | null = null;
    let product: string | null = null;
    let quantity = 1;

    // Check for mode switching
    if (lower.includes('supplier') || lower.includes('came') || 
        (tamil && (command.includes('விற்பனையாளர்') || command.includes('வந்தார்')))) {
      type = 'supplier';
    } else if (lower.includes('customer') || lower.includes('bought') || lower.includes('sale') || 
               (tamil && (command.includes('வாடிக்கையாளர்') || command.includes('வாங்கினார்') || command.includes('விற்பனை')))) {
      type = 'customer';
    }

    // Check for add/sell actions
    if (lower.includes('add') || lower.includes('சேர்')) {
      type = 'add';
    } else if (lower.includes('sell') || lower.includes('sold') || lower.includes('விற்பனை')) {
      type = 'sell';
    }

    // Extract product name (simple mapping)
    const productMap: Record<string, string> = {
      'rice': 'rice', 'soap': 'soap', 'milk': 'milk', 'oil': 'oil',
      'sugar': 'sugar', 'salt': 'salt', 'battery': 'battery', 'biscuit': 'biscuit',
      'tea': 'tea', 'coffee': 'coffee', 'dal': 'dal', 'spice': 'spice',
      'bread': 'bread', 'egg': 'egg', 'onion': 'onion', 'potato': 'potato',
      'tomato': 'tomato', 'banana': 'banana', 'apple': 'apple', 'orange': 'orange',
      
      // Tamil mappings
      'அரிசி': 'rice', 'சோப்': 'soap', 'பால்': 'milk', 'எண்ணெய்': 'oil',
      'சர்க்கரை': 'sugar', 'உப்பு': 'salt', 'பேட்டரி': 'battery', 'பிஸ்கட்': 'biscuit',
      'டீ': 'tea', 'காபி': 'coffee', 'பருப்பு': 'dal', 'மசாலா': 'spice',
      'பிரெட்': 'bread', 'முட்டை': 'egg', 'வெங்காயம்': 'onion', 'உருளைக்கிழங்கு': 'potato',
      'தக்காளி': 'tomato', 'வாழைப்பழம்': 'banana', 'ஆப்பிள்': 'apple', 'ஆரஞ்சு': 'orange'
    };

    for (const [key, value] of Object.entries(productMap)) {
      if (lower.includes(key) || command.includes(key)) {
        product = value;
        break;
      }
    }

    // Extract quantity
    const numberMatch = command.match(/\d+/);
    if (numberMatch) {
      quantity = parseInt(numberMatch[0], 10);
    }

    // Tamil number words
    const tamilNumbers: Record<string, number> = {
      'ஒன்று': 1, 'இரண்டு': 2, 'மூன்று': 3, 'நான்கு': 4, 'ஐந்து': 5,
      'ஆறு': 6, 'ஏழு': 7, 'எட்டு': 8, 'ஒன்பது': 9, 'பத்து': 10
    };

    for (const [word, num] of Object.entries(tamilNumbers)) {
      if (command.includes(word)) {
        quantity = num;
        break;
      }
    }

    return { type, product, quantity };
  }

  // Simple error messages
  static getErrorMessage(errors: string[]): string {
    if (errors.length === 1) {
      return `❌ ${errors[0]}`;
    } else {
      return `❌ Multiple issues:\n${errors.map(e => `• ${e}`).join('\n')}`;
    }
  }

  // Simple confirmation messages
  static getConfirmationMessage(action: BasketAction): string {
    const itemCount = action.items.length;
    const actionText = action.type === 'add_stock' ? 'add to stock' : 'record sale';
    
    if (itemCount === 1) {
      const item = action.items[0];
      return `Are you sure you want to ${actionText}?\n\n${item.icon} ${item.productName}: ${item.quantity} ${item.unit}`;
    } else {
      return `Are you sure you want to ${actionText} ${itemCount} different products?`;
    }
  }

  // Check if product exists in inventory
  static findProductInInventory(productName: string, inventory: any[]): any | null {
    const lowerName = productName.toLowerCase();
    
    return inventory.find(item => {
      const itemName = item.productName.toLowerCase();
      return itemName.includes(lowerName) || lowerName.includes(itemName);
    }) || null;
  }

  // Get low stock items
  static getLowStockItems(inventory: any[]): any[] {
    return inventory.filter(item => 
      item.quantity <= item.minStockLevel && item.quantity > 0
    );
  }

  // Get out of stock items
  static getOutOfStockItems(inventory: any[]): any[] {
    return inventory.filter(item => item.quantity === 0);
  }

  // Simple analytics
  static getInventoryStats(inventory: any[]): {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    healthyStockCount: number;
  } {
    const totalProducts = inventory.length;
    const lowStockItems = this.getLowStockItems(inventory);
    const outOfStockItems = this.getOutOfStockItems(inventory);
    
    return {
      totalProducts,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      healthyStockCount: totalProducts - lowStockItems.length - outOfStockItems.length
    };
  }
}