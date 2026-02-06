import React from 'react';
import { InventoryItem } from '../../services/inventoryService';

interface BasketProductIconProps {
  product: InventoryItem;
  icon: string;
  onDragStart: () => void;
  isDragging: boolean;
  disabled?: boolean;
}

const BasketProductIcon: React.FC<BasketProductIconProps> = ({
  product,
  icon,
  onDragStart,
  isDragging,
  disabled = false
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    
    // Set drag data
    e.dataTransfer.setData('application/json', JSON.stringify({
      productId: product._id,
      productName: product.productName,
      icon: icon,
      quantity: 1,
      unit: product.unit,
      availableStock: product.quantity
    }));
    
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    // Add visual feedback for touch
    e.currentTarget.classList.add('touch-dragging');
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.currentTarget.classList.remove('touch-dragging');
  };

  const getStockStatusColor = () => {
    switch (product.stockStatus) {
      case 'SAFE': return '#28a745';
      case 'LOW_STOCK': return '#ffc107';
      case 'OUT_OF_STOCK': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div
      className={`basket-product-icon ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      draggable={!disabled && product.quantity > 0}
      onDragStart={handleDragStart}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        opacity: disabled ? 0.5 : isDragging ? 0.7 : 1,
        cursor: disabled ? 'not-allowed' : product.quantity > 0 ? 'grab' : 'not-allowed',
        borderColor: getStockStatusColor()
      }}
    >
      {/* Product Icon */}
      <div className="product-icon-display">
        <span className="icon-emoji">{icon}</span>
        
        {/* Stock status indicator */}
        <div 
          className="stock-indicator"
          style={{ backgroundColor: getStockStatusColor() }}
        />
        
        {/* Out of stock overlay */}
        {product.quantity === 0 && (
          <div className="out-of-stock-overlay">
            <span>❌</span>
          </div>
        )}
      </div>

      {/* Product Name */}
      <div className="product-name-display">
        {product.productName}
      </div>

      {/* Stock Info */}
      <div className="stock-info">
        <span className="quantity">{product.quantity}</span>
        <span className="unit">{product.unit}</span>
      </div>

      {/* Drag Hint */}
      {!disabled && product.quantity > 0 && (
        <div className="drag-hint">
          <span className="drag-icon">👆</span>
          <span className="drag-text">Drag me</span>
        </div>
      )}

      {/* Touch Feedback */}
      <div className="touch-feedback" />
    </div>
  );
};

export default BasketProductIcon;