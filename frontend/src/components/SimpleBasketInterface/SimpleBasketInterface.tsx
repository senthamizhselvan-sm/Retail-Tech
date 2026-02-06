import React, { useState } from 'react';
import './SimpleBasket.css';

interface BasketItem {
  productId: string;
  productName: string;
  icon: string;
  quantity: number;
  unit: string;
  currentStock: number;
}

interface SimpleBasketInterfaceProps {
  inventory: any[];
  onUpdate: (action: any) => Promise<void>;
  loading?: boolean;
}

const SimpleBasketInterface: React.FC<SimpleBasketInterfaceProps> = ({
  inventory,
  onUpdate,
  loading = false
}) => {
  // SUPER SIMPLE: Only two modes
  const [mode, setMode] = useState<'none' | 'supplier' | 'customer'>('none');
  const [selectedItems, setSelectedItems] = useState<BasketItem[]>([]);

  // Get product icon based on name
  const getProductIcon = (name: string): string => {
    const icons: Record<string, string> = {
      'rice': '🍚', 'soap': '🧼', 'milk': '🥛', 'oil': '🛢️',
      'sugar': '🍬', 'salt': '🧂', 'battery': '🔋', 'biscuit': '🍪',
      'tea': '🍵', 'coffee': '☕', 'dal': '🫘', 'spices': '🌶️',
      'bread': '🍞', 'egg': '🥚', 'onion': '🧅', 'potato': '🥔',
      'tomato': '🍅', 'banana': '🍌', 'apple': '🍎', 'orange': '🍊'
    };
    
    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (lowerName.includes(key)) return icon;
    }
    return '📦'; // default
  };

  // Handle product selection - SIMPLE TAP
  const handleProductSelect = (product: any) => {
    const existingItem = selectedItems.find(item => item.productId === product._id);
    
    if (existingItem) {
      // Increase quantity of existing item
      setSelectedItems(items =>
        items.map(item =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // Add new item
      const newItem: BasketItem = {
        productId: product._id,
        productName: product.productName,
        icon: getProductIcon(product.productName),
        quantity: 1,
        unit: product.unit,
        currentStock: product.quantity
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  // Update quantity for selected item
  const updateQuantity = (productId: string, delta: number) => {
    setSelectedItems(items =>
      items.map(item => {
        if (item.productId === productId) {
          const newQuantity = item.quantity + delta;
          // Can't go below 1
          return { ...item, quantity: Math.max(1, newQuantity) };
        }
        return item;
      })
    );
  };

  // Remove item from selection
  const removeItem = (productId: string) => {
    setSelectedItems(items => items.filter(item => item.productId !== productId));
  };

  // Complete the action
  const handleComplete = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    // Check stock for customer sales
    if (mode === 'customer') {
      for (const item of selectedItems) {
        if (item.quantity > item.currentStock) {
          alert(`Not enough ${item.productName}! Only ${item.currentStock} left.`);
          return;
        }
      }
    }

    const action = {
      type: mode === 'supplier' ? 'add_stock' : 'sell_stock',
      items: selectedItems,
      timestamp: new Date()
    };

    await onUpdate(action);

    // Reset
    setSelectedItems([]);
    setMode('none');
  };

  // Get visual stock indicator
  const getStockIndicator = (quantity: number, minStock: number) => {
    if (quantity === 0) return '🔴';
    if (quantity <= minStock) return '🟡';
    return '🟢';
  };

  // Get low stock items for warning
  const getLowStockItems = () => {
    return inventory.filter(item => item.quantity <= item.minStockLevel && item.quantity > 0);
  };

  const lowStockItems = getLowStockItems();

  return (
    <div className="simple-basket-container">
      {/* STEP 1: Choose Mode (Only shows if no mode selected) */}
      {mode === 'none' && (
        <div className="mode-selection">
          <h2 className="main-title">🏬 What happened in your shop?</h2>
          
          {/* Low Stock Warning */}
          {lowStockItems.length > 0 && (
            <div className="low-stock-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-text">
                <strong>Low Stock Alert!</strong>
                {lowStockItems.map(item => (
                  <span key={item._id}>
                    {getProductIcon(item.productName)} {item.productName} ({item.quantity} left)
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mode-cards">
            <div 
              className="mode-card supplier-mode"
              onClick={() => setMode('supplier')}
            >
              <div className="mode-icon">🚚</div>
              <div className="mode-title">Supplier Came</div>
              <div className="mode-subtitle">விற்பனையாளர் வந்தார்</div>
              <div className="mode-description">Tap if supplier delivered new stock</div>
            </div>

            <div 
              className="mode-card customer-mode"
              onClick={() => setMode('customer')}
            >
              <div className="mode-icon">👤</div>
              <div className="mode-title">Customer Bought</div>
              <div className="mode-subtitle">வாடிக்கையாளர் வாங்கினார்</div>
              <div className="mode-description">Tap if customer bought items</div>
            </div>
          </div>

          {/* Current Stock Display */}
          <div className="current-stock-display">
            <h3>📦 Your Current Stock</h3>
            <div className="stock-grid">
              {inventory.slice(0, 6).map(product => (
                <div key={product._id} className="stock-item">
                  <div className="stock-icon">{getProductIcon(product.productName)}</div>
                  <div className="stock-name">{product.productName}</div>
                  <div className="stock-quantity">
                    {product.quantity} {product.unit}
                    <span className="stock-status">
                      {getStockIndicator(product.quantity, product.minStockLevel)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Mode Active - Select Products */}
      {mode !== 'none' && (
        <div className="active-mode">
          {/* Header with clear mode indicator */}
          <div className={`mode-header ${mode}`}>
            <button 
              className="back-button"
              onClick={() => {
                setMode('none');
                setSelectedItems([]);
              }}
            >
              ← Back
            </button>
            <div className="mode-title-large">
              {mode === 'supplier' ? '🚚 Supplier Stock' : '👤 Customer Sale'}
              <span className="mode-subtitle-large">
                {mode === 'supplier' 
                  ? 'Select items delivered by supplier' 
                  : 'Select items bought by customer'
                }
              </span>
            </div>
          </div>

          {/* Selected Items Basket */}
          {selectedItems.length > 0 && (
            <div className="selected-basket">
              <h3>
                {mode === 'supplier' ? '📥 Items to Add' : '📤 Items Sold'}
                <span className="item-count">{selectedItems.length}</span>
              </h3>
              
              <div className="selected-items-list">
                {selectedItems.map(item => (
                  <div key={item.productId} className="selected-item">
                    <div className="item-icon">{item.icon}</div>
                    <div className="item-details">
                      <div className="item-name">{item.productName}</div>
                      <div className="item-info">
                        Current: {item.currentStock} {item.unit}
                      </div>
                    </div>
                    <div className="quantity-controls">
                      <button 
                        className="qty-btn minus"
                        onClick={() => updateQuantity(item.productId, -1)}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <div className="quantity-display">
                        <span className="quantity">{item.quantity}</span>
                        <span className="unit">{item.unit}</span>
                      </div>
                      <button 
                        className="qty-btn plus"
                        onClick={() => updateQuantity(item.productId, 1)}
                      >
                        +
                      </button>
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeItem(item.productId)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button 
                className="complete-btn"
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? '⏳ Processing...' : (
                  <>
                    ✅ {mode === 'supplier' ? 'Add to Stock' : 'Record Sale'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Product Shelf */}
          <div className="product-shelf">
            <h3>📦 Tap Items to Select</h3>
            <div className="shelf-grid">
              {inventory.map(product => (
                <div 
                  key={product._id}
                  className={`product-card ${
                    selectedItems.some(item => item.productId === product._id) ? 'selected' : ''
                  }`}
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="product-icon">{getProductIcon(product.productName)}</div>
                  <div className="product-name">{product.productName}</div>
                  <div className="stock-info">
                    <span className="stock-quantity">{product.quantity} {product.unit}</span>
                    <span className="stock-indicator">
                      {getStockIndicator(product.quantity, product.minStockLevel)}
                    </span>
                  </div>
                  {selectedItems.some(item => item.productId === product._id) && (
                    <div className="selected-badge">
                      ✓ Added ({selectedItems.find(item => item.productId === product._id)?.quantity})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Voice Commands */}
      <div className="voice-help">
        <div className="voice-title">🎤 Voice Commands:</div>
        <div className="voice-commands">
          <span>"Supplier came" / "விற்பனையாளர் வந்தார்"</span>
          <span>"Customer bought" / "வாடிக்கையாளர் வாங்கினார்"</span>
          <span>"Add soap" / "சோப் சேர்"</span>
          <span>"Sell rice" / "அரிசி விற்பனை"</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleBasketInterface;