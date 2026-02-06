import React from 'react';
import { BasketItem } from '../../utils/basketHelpers';

interface BasketAreaProps {
  type: 'incoming' | 'outgoing';
  items: BasketItem[];
  isActive: boolean;
  dragOverBasket: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onEmpty: () => void;
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  disabled?: boolean;
}

const BasketArea: React.FC<BasketAreaProps> = ({
  type,
  items,
  isActive,
  dragOverBasket,
  onDragOver,
  onDrop,
  onEmpty,
  onRemoveItem,
  onUpdateQuantity,
  disabled = false
}) => {
  const isIncoming = type === 'incoming';
  const isDragOver = dragOverBasket === type;
  
  const basketConfig = {
    incoming: {
      title: '📥 Incoming Basket',
      subtitle: 'Supplier Deliveries',
      emptyMessage: 'Drop products here to add to inventory',
      color: '#4CAF50',
      icon: '📦'
    },
    outgoing: {
      title: '📤 Outgoing Basket', 
      subtitle: 'Customer Sales',
      emptyMessage: 'Drop products here to sell',
      color: '#2196F3',
      icon: '🛒'
    }
  };

  const config = basketConfig[type];

  return (
    <div 
      className={`basket-area ${isActive ? 'active' : ''} ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        borderColor: isActive ? config.color : '#ccc',
        backgroundColor: isActive ? `${config.color}10` : '#f9f9f9'
      }}
    >
      {/* Basket Header */}
      <div className="basket-header">
        <div className="basket-title">
          <span className="basket-icon">{config.icon}</span>
          <div>
            <h4>{config.title}</h4>
            <p className="basket-subtitle">{config.subtitle}</p>
          </div>
        </div>
        
        {items.length > 0 && (
          <button 
            className="empty-basket-btn"
            onClick={onEmpty}
            disabled={disabled}
            title="Empty basket"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Basket Content */}
      <div className="basket-content">
        {items.length === 0 ? (
          <div className="empty-basket">
            <div className="drop-zone">
              <div className="drop-icon">{config.icon}</div>
              <p className="drop-message">{config.emptyMessage}</p>
              {!isActive && (
                <p className="mode-hint">
                  Switch to {isIncoming ? 'Supplier' : 'Customer'} mode to use this basket
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="basket-items">
            {items.map(item => (
              <div key={item.productId} className="basket-item">
                <div className="item-info">
                  <span className="item-icon">{item.icon}</span>
                  <div className="item-details">
                    <div className="item-name">{item.productName}</div>
                    <div className="item-quantity">
                      {item.quantity} {item.unit}
                    </div>
                  </div>
                </div>
                
                <div className="item-controls">
                  <button
                    className="quantity-btn decrease"
                    onClick={() => onUpdateQuantity(item.productId, -1)}
                    disabled={disabled || item.quantity <= 1}
                  >
                    −
                  </button>
                  
                  <span className="quantity-display">{item.quantity}</span>
                  
                  <button
                    className="quantity-btn increase"
                    onClick={() => onUpdateQuantity(item.productId, 1)}
                    disabled={disabled}
                  >
                    +
                  </button>
                  
                  <button
                    className="remove-btn"
                    onClick={() => onRemoveItem(item.productId)}
                    disabled={disabled}
                    title="Remove from basket"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Basket Summary */}
      {items.length > 0 && (
        <div className="basket-summary">
          <div className="summary-stats">
            <span className="total-items">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
            <span className="total-quantity">
              {items.reduce((sum, item) => sum + item.quantity, 0)} total units
            </span>
          </div>
        </div>
      )}

      {/* Visual feedback for drag over */}
      {isDragOver && (
        <div className="drag-overlay">
          <div className="drag-indicator">
            <div className="drag-icon">⬇️</div>
            <p>Drop here to add to {config.title.toLowerCase()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasketArea;