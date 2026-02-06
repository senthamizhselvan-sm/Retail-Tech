import React from 'react';
import { InventoryItem } from '../../services/inventoryService';
import BasketProductIcon from '../BasketProductIcon/BasketProductIcon';
import VisualStockIndicator from '../VisualStockIndicator/VisualStockIndicator';

interface ProductShelfProps {
  products: InventoryItem[];
  onDragStart: (item: InventoryItem) => void;
  draggedItem: InventoryItem | null;
  disabled?: boolean;
}

const ProductShelf: React.FC<ProductShelfProps> = ({
  products,
  onDragStart,
  draggedItem,
  disabled = false
}) => {
  // Get product icon based on category or name
  const getProductIcon = (product: InventoryItem): string => {
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
    
    // Beverages
    if (name.includes('water') || name.includes('தண்ணீர்')) return '💧';
    if (name.includes('juice') || name.includes('ஜூஸ்')) return '🧃';
    if (name.includes('soda') || name.includes('சோடா')) return '🥤';
    
    // Category-based fallbacks
    if (category.includes('food') || category.includes('உணவு')) return '🍽️';
    if (category.includes('dairy') || category.includes('பால் பொருட்கள்')) return '🥛';
    if (category.includes('personal') || category.includes('தனிப்பட்ட')) return '🧴';
    if (category.includes('household') || category.includes('வீட்டு')) return '🏠';
    if (category.includes('snack') || category.includes('சிற்றுண்டி')) return '🍿';
    if (category.includes('beverage') || category.includes('பானம்')) return '🥤';
    if (category.includes('medicine') || category.includes('மருந்து')) return '💊';
    if (category.includes('stationery') || category.includes('எழுதுபொருள்')) return '📝';
    
    // Default icon
    return '📦';
  };

  return (
    <div className="product-shelf">
      <div className="shelf-header">
        <h3>🏪 Product Shelf</h3>
        <p className="shelf-instruction">
          Drag products to baskets below
        </p>
      </div>
      
      <div className="shelf-grid">
        {products.map(product => (
          <div key={product._id} className="shelf-item">
            <BasketProductIcon
              product={product}
              icon={getProductIcon(product)}
              onDragStart={() => onDragStart(product)}
              isDragging={draggedItem?._id === product._id}
              disabled={disabled}
            />
            
            <div className="product-info">
              <div className="product-name">{product.productName}</div>
              <div className="product-quantity">
                {product.quantity} {product.unit}
              </div>
            </div>
            
            <VisualStockIndicator
              quantity={product.quantity}
              maxCapacity={product.minStockLevel * 5} // Assume 5x min is full capacity
              unit={product.unit}
              stockStatus={product.stockStatus}
            />
          </div>
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="empty-shelf">
          <div className="empty-icon">📦</div>
          <p>No products available</p>
          <p>Add products to your inventory first</p>
        </div>
      )}
    </div>
  );
};

export default ProductShelf;