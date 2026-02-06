import { InventoryItem, ActivityLog } from '../services/inventoryService';

// Basket-specific types
export interface BasketItem {
  productId: string;
  productName: string;
  icon: string;
  quantity: number;
  unit: string;
  availableStock?: number;
}

export interface BasketAction {
  type: 'delivery' | 'sale' | 'add' | 'remove';
  items: BasketItem[];
  timestamp: Date;
  cashAmount?: number;
  isCredit?: boolean;
  debtorId?: string;
  mode?: 'supplier' | 'customer';
}

export interface BasketUpdateResponse {
  success: boolean;
  message: string;
  updatedInventory: InventoryItem[];
  activityLogs: ActivityLog[];
  hasUndoAction: boolean;
}

// Helper functions for basket operations
export class BasketHelpers {
  
  // Convert inventory item to basket item
  static inventoryToBasketItem(
    inventoryItem: InventoryItem, 
    quantity: number = 1,
    icon: string = '📦'
  ): BasketItem {
    return {
      productId: inventoryItem._id,
      productName: inventoryItem.productName,
      icon,
      quantity,
      unit: inventoryItem.unit,
      availableStock: inventoryItem.quantity
    };
  }

  // Calculate total quantity in basket
  static getTotalQuantity(items: BasketItem[]): number {
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  // Calculate total items count in basket
  static getTotalItems(items: BasketItem[]): number {
    return items.length;
  }

  // Get basket summary text
  static getBasketSummary(items: BasketItem[]): string {
    const totalItems = this.getTotalItems(items);
    const totalQuantity = this.getTotalQuantity(items);
    
    if (totalItems === 0) return 'Empty basket';
    if (totalItems === 1) return `1 item (${totalQuantity} units)`;
    return `${totalItems} items (${totalQuantity} total units)`;
  }

  // Validate basket action
  static validateBasketAction(
    action: BasketAction, 
    inventory: InventoryItem[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if items exist in inventory
    for (const item of action.items) {
      const inventoryItem = inventory.find(inv => inv._id === item.productId);
      
      if (!inventoryItem) {
        errors.push(`Product "${item.productName}" not found in inventory`);
        continue;
      }

      // For sales, check stock availability
      if (action.type === 'sale' && inventoryItem.quantity < item.quantity) {
        errors.push(
          `Insufficient stock for "${item.productName}". ` +
          `Available: ${inventoryItem.quantity}, Required: ${item.quantity}`
        );
      }

      // Validate quantity
      if (item.quantity <= 0) {
        errors.push(`Invalid quantity for "${item.productName}": ${item.quantity}`);
      }
    }

    // Validate cash amount for sales
    if (action.type === 'sale' && action.cashAmount !== undefined && action.cashAmount < 0) {
      errors.push('Cash amount cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Merge duplicate items in basket
  static mergeDuplicateItems(items: BasketItem[]): BasketItem[] {
    const merged: Record<string, BasketItem> = {};

    for (const item of items) {
      if (merged[item.productId]) {
        merged[item.productId].quantity += item.quantity;
      } else {
        merged[item.productId] = { ...item };
      }
    }

    return Object.values(merged);
  }

  // Convert basket action to inventory updates
  static basketActionToInventoryUpdates(action: BasketAction): Array<{
    productId: string;
    quantityDelta: number;
    source: string;
  }> {
    const updates: Array<{
      productId: string;
      quantityDelta: number;
      source: string;
    }> = [];

    for (const item of action.items) {
      let quantityDelta = 0;
      
      switch (action.type) {
        case 'delivery':
          quantityDelta = item.quantity; // Add stock
          break;
        case 'sale':
          quantityDelta = -item.quantity; // Remove stock
          break;
        case 'add':
          quantityDelta = item.quantity;
          break;
        case 'remove':
          quantityDelta = -item.quantity;
          break;
      }

      updates.push({
        productId: item.productId,
        quantityDelta,
        source: 'basket'
      });
    }

    return updates;
  }

  // Generate activity log entries from basket action
  static basketActionToActivityLogs(action: BasketAction): Partial<ActivityLog>[] {
    const logs: Partial<ActivityLog>[] = [];

    for (const item of action.items) {
      let logType: 'add' | 'reduce' | 'create' = 'add';
      let quantityChange = item.quantity;

      switch (action.type) {
        case 'delivery':
          logType = 'add';
          quantityChange = item.quantity;
          break;
        case 'sale':
          logType = 'reduce';
          quantityChange = -item.quantity;
          break;
        case 'add':
          logType = 'add';
          quantityChange = item.quantity;
          break;
        case 'remove':
          logType = 'reduce';
          quantityChange = -item.quantity;
          break;
      }

      logs.push({
        type: logType,
        productName: item.productName,
        quantityChange,
        source: 'basket',
        timestamp: action.timestamp.toISOString(),
        unit: item.unit
      });
    }

    return logs;
  }

  // Get product icon based on name/category
  static getProductIcon(product: InventoryItem): string {
    const name = product.productName.toLowerCase();
    const category = product.category?.toLowerCase() || '';
    
    // Food items
    if (name.includes('rice') || name.includes('அரிசி')) return '🍚';
    if (name.includes('milk') || name.includes('பால்')) return '🥛';
    if (name.includes('bread') || name.includes('பிரெட்')) return '🍞';
    if (name.includes('egg') || name.includes('முட்டை')) return '🥚';
    if (name.includes('sugar') || name.includes('சர்க்கரை')) return '🍯';
    if (name.includes('salt') || name.includes('உப்பு')) return '🧂';
    if (name.includes('oil') || name.includes('எண்ணெய்')) return '🛢️';
    if (name.includes('tea') || name.includes('டீ')) return '🍵';
    if (name.includes('coffee') || name.includes('காபி')) return '☕';
    
    // Personal care
    if (name.includes('soap') || name.includes('சோப்')) return '🧼';
    if (name.includes('shampoo') || name.includes('ஷாம்பூ')) return '🧴';
    if (name.includes('toothpaste') || name.includes('பல் பேஸ்ட்')) return '🦷';
    
    // Household
    if (name.includes('battery') || name.includes('பேட்டரி')) return '🔋';
    if (name.includes('bulb') || name.includes('பல்ப்')) return '💡';
    if (name.includes('candle') || name.includes('மெழுகுவர்த்தி')) return '🕯️';
    
    // Snacks
    if (name.includes('biscuit') || name.includes('பிஸ்கட்')) return '🍪';
    if (name.includes('chocolate') || name.includes('சாக்லேட்')) return '🍫';
    if (name.includes('chips') || name.includes('சிப்ஸ்')) return '🥔';
    
    // Category-based fallbacks
    if (category.includes('food') || category.includes('உணவு')) return '🍽️';
    if (category.includes('dairy') || category.includes('பால் பொருட்கள்')) return '🥛';
    if (category.includes('personal') || category.includes('தனிப்பட்ட')) return '🧴';
    if (category.includes('household') || category.includes('வீட்டு')) return '🏠';
    if (category.includes('snack') || category.includes('சிற்றுண்டி')) return '🍿';
    if (category.includes('beverage') || category.includes('பானம்')) return '🥤';
    
    // Default
    return '📦';
  }

  // Format currency for display
  static formatCurrency(amount: number): string {
    return `₹${amount.toFixed(2)}`;
  }

  // Parse voice command for basket operations
  static parseBasketVoiceCommand(command: string): {
    action?: string;
    mode?: 'supplier' | 'customer';
    amount?: number;
    productName?: string;
    quantity?: number;
  } {
    const lowerCommand = command.toLowerCase();
    const result: any = {};

    // Mode switching
    if (lowerCommand.includes('supplier mode') || lowerCommand.includes('விற்பனையாளர்')) {
      result.action = 'switch_mode';
      result.mode = 'supplier';
    } else if (lowerCommand.includes('customer mode') || lowerCommand.includes('வாடிக்கையாளர்')) {
      result.action = 'switch_mode';
      result.mode = 'customer';
    }

    // Basket actions
    if (lowerCommand.includes('confirm delivery') || lowerCommand.includes('டெலிவரி உறுதி')) {
      result.action = 'confirm_delivery';
    } else if (lowerCommand.includes('complete sale') || lowerCommand.includes('விற்பனை முடிவு')) {
      result.action = 'complete_sale';
    } else if (lowerCommand.includes('reset all') || lowerCommand.includes('அனைத்தும் ரீசெட்')) {
      result.action = 'reset_all';
    }

    // Cash operations
    const cashMatch = lowerCommand.match(/add (\d+) rupees?|(\d+) ரூபாய் சேர்/);
    if (cashMatch) {
      result.action = 'add_cash';
      result.amount = parseInt(cashMatch[1] || cashMatch[2]);
    }

    return result;
  }

  // Generate success message for basket action
  static getSuccessMessage(action: BasketAction): string {
    const itemCount = action.items.length;
    const totalQuantity = this.getTotalQuantity(action.items);

    switch (action.type) {
      case 'delivery':
        return `✅ Delivery confirmed! Added ${itemCount} product${itemCount !== 1 ? 's' : ''} (${totalQuantity} total units) to inventory.`;
      
      case 'sale':
        const cashText = action.cashAmount ? ` Cash received: ${this.formatCurrency(action.cashAmount)}` : '';
        return `💰 Sale completed! Sold ${itemCount} product${itemCount !== 1 ? 's' : ''} (${totalQuantity} total units).${cashText}`;
      
      case 'add':
        return `📦 Added ${itemCount} product${itemCount !== 1 ? 's' : ''} to basket.`;
      
      case 'remove':
        return `🗑️ Removed ${itemCount} product${itemCount !== 1 ? 's' : ''} from basket.`;
      
      default:
        return `✅ Basket action completed successfully.`;
    }
  }
}

export default BasketHelpers;