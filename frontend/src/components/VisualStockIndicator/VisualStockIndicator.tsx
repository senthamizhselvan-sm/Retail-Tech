import React from 'react';

interface VisualStockIndicatorProps {
  quantity: number;
  maxCapacity: number;
  unit: string;
  stockStatus?: 'SAFE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

const VisualStockIndicator: React.FC<VisualStockIndicatorProps> = ({
  quantity,
  maxCapacity,
  unit,
  stockStatus = 'SAFE'
}) => {
  const percentage = Math.min((quantity / maxCapacity) * 100, 100);
  const isLiquid = unit === 'liter' || unit === 'ml';
  const isWeight = unit === 'kg' || unit === 'gram';
  
  // Determine number of dots for discrete items
  const maxDots = 5;
  const filledDots = Math.ceil((quantity / maxCapacity) * maxDots);

  const getStatusColor = () => {
    switch (stockStatus) {
      case 'SAFE': return '#28a745';
      case 'LOW_STOCK': return '#ffc107';
      case 'OUT_OF_STOCK': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusMessage = () => {
    if (quantity === 0) return '🔴 Out of stock';
    if (percentage >= 80) return '🟢 Plenty in stock';
    if (percentage >= 40) return '🟡 Moderate stock';
    if (percentage >= 10) return '🟠 Low stock';
    return '🔴 Very low - reorder!';
  };

  const renderLiquidIndicator = () => (
    <div className="liquid-container">
      <div className="container-visual">
        <div 
          className="container-fill"
          style={{ 
            height: `${percentage}%`,
            backgroundColor: getStatusColor(),
            background: `linear-gradient(to top, ${getStatusColor()}, ${getStatusColor()}aa)`
          }}
        />
        <div className="container-waves">
          {percentage > 0 && (
            <>
              <div className="wave wave1" />
              <div className="wave wave2" />
            </>
          )}
        </div>
        <div className="container-label">
          {quantity} {unit}
        </div>
      </div>
      <div className="container-base" />
    </div>
  );

  const renderWeightIndicator = () => (
    <div className="weight-container">
      <div className="scale-visual">
        <div className="scale-pan">
          <div 
            className="weight-fill"
            style={{ 
              height: `${percentage}%`,
              backgroundColor: getStatusColor()
            }}
          />
        </div>
        <div className="scale-base" />
        <div className="weight-label">
          {quantity} {unit}
        </div>
      </div>
    </div>
  );

  const renderDotIndicator = () => (
    <div className="dot-container">
      <div className="dot-indicator">
        {[...Array(maxDots)].map((_, i) => (
          <span 
            key={i} 
            className={`dot ${i < filledDots ? 'filled' : 'empty'}`}
            style={{
              backgroundColor: i < filledDots ? getStatusColor() : '#e0e0e0'
            }}
          />
        ))}
      </div>
      <div className="dot-text">
        {quantity} {unit}
      </div>
    </div>
  );

  const renderProgressBar = () => (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getStatusColor()
          }}
        />
      </div>
      <div className="progress-text">
        {quantity} / {maxCapacity} {unit}
      </div>
    </div>
  );

  return (
    <div className="visual-stock-indicator">
      {/* Main Visual Representation */}
      <div className="indicator-visual">
        {isLiquid && renderLiquidIndicator()}
        {isWeight && renderWeightIndicator()}
        {!isLiquid && !isWeight && quantity <= 20 && renderDotIndicator()}
        {!isLiquid && !isWeight && quantity > 20 && renderProgressBar()}
      </div>

      {/* Status Message */}
      <div className="stock-status-message">
        {getStatusMessage()}
      </div>

      {/* Detailed Info */}
      <div className="stock-details">
        <div className="detail-item">
          <span className="label">Current:</span>
          <span className="value">{quantity} {unit}</span>
        </div>
        <div className="detail-item">
          <span className="label">Capacity:</span>
          <span className="value">{maxCapacity} {unit}</span>
        </div>
        <div className="detail-item">
          <span className="label">Fill:</span>
          <span className="value">{percentage.toFixed(1)}%</span>
        </div>
      </div>

      {/* Visual Enhancement Effects */}
      {quantity > 0 && (
        <div className="indicator-effects">
          {/* Pulse effect for low stock */}
          {stockStatus === 'LOW_STOCK' && (
            <div className="pulse-effect low-stock" />
          )}
          
          {/* Blink effect for out of stock */}
          {stockStatus === 'OUT_OF_STOCK' && (
            <div className="blink-effect out-of-stock" />
          )}
          
          {/* Sparkle effect for good stock */}
          {stockStatus === 'SAFE' && percentage > 80 && (
            <div className="sparkle-effect">
              <span className="sparkle">✨</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisualStockIndicator;