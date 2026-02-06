import React, { useState } from 'react';

interface CashPotProps {
  amount: number;
  onAddCash: (amount: number) => void;
  onEmpty: () => void;
  disabled?: boolean;
}

const CashPot: React.FC<CashPotProps> = ({
  amount,
  onAddCash,
  onEmpty,
  disabled = false
}) => {
  const [inputAmount, setInputAmount] = useState<string>('');
  const [showInput, setShowInput] = useState(false);

  // Quick amount buttons
  const quickAmounts = [10, 20, 50, 100, 500];

  const handleAddAmount = (value: number) => {
    onAddCash(value);
    setInputAmount('');
    setShowInput(false);
  };

  const handleCustomAmount = () => {
    const value = parseFloat(inputAmount);
    if (value > 0) {
      handleAddAmount(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomAmount();
    }
  };

  // Calculate fill percentage for visual effect
  const maxAmount = 1000; // Assume max pot capacity
  const fillPercentage = Math.min((amount / maxAmount) * 100, 100);

  return (
    <div className="cash-pot-container">
      <div className="cash-pot-header">
        <h4>🏺 Cash Pot</h4>
        <p className="cash-amount">₹{amount.toFixed(2)}</p>
      </div>

      {/* Visual Clay Pot */}
      <div className="cash-pot">
        <div className="pot-body">
          <div 
            className="pot-fill"
            style={{ 
              height: `${fillPercentage}%`,
              background: `linear-gradient(to top, #FFD700 0%, #FFA500 50%, #FF8C00 100%)`
            }}
          />
          <div className="pot-rim" />
          
          {/* Cash coins animation */}
          {amount > 0 && (
            <div className="cash-coins">
              {[...Array(Math.min(Math.floor(amount / 100), 5))].map((_, i) => (
                <div 
                  key={i} 
                  className="coin"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    left: `${20 + (i * 15)}%`,
                    top: `${80 - fillPercentage + (i * 5)}%`
                  }}
                >
                  ₹
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Pot label */}
        <div className="pot-label">
          {amount === 0 ? 'Empty' : `₹${amount}`}
        </div>
      </div>

      {/* Cash Controls */}
      <div className="cash-controls">
        {/* Quick Amount Buttons */}
        <div className="quick-amounts">
          <p className="control-label">Quick Add:</p>
          <div className="amount-buttons">
            {quickAmounts.map(amt => (
              <button
                key={amt}
                className="amount-btn"
                onClick={() => handleAddAmount(amt)}
                disabled={disabled}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div className="custom-amount">
          {!showInput ? (
            <button
              className="custom-btn"
              onClick={() => setShowInput(true)}
              disabled={disabled}
            >
              💰 Custom Amount
            </button>
          ) : (
            <div className="custom-input">
              <input
                type="number"
                placeholder="Enter amount"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={disabled}
                min="0"
                step="0.01"
                autoFocus
              />
              <button
                className="add-btn"
                onClick={handleCustomAmount}
                disabled={disabled || !inputAmount || parseFloat(inputAmount) <= 0}
              >
                Add
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowInput(false);
                  setInputAmount('');
                }}
                disabled={disabled}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Empty Pot Button */}
        {amount > 0 && (
          <button
            className="empty-pot-btn"
            onClick={onEmpty}
            disabled={disabled}
          >
            🗑️ Empty Pot
          </button>
        )}
      </div>

      {/* Cash Summary */}
      <div className="cash-summary">
        <div className="summary-item">
          <span className="label">Total Cash:</span>
          <span className="value">₹{amount.toFixed(2)}</span>
        </div>
        
        {amount > 0 && (
          <>
            <div className="summary-item">
              <span className="label">Notes (₹500):</span>
              <span className="value">{Math.floor(amount / 500)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Notes (₹100):</span>
              <span className="value">{Math.floor((amount % 500) / 100)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Coins:</span>
              <span className="value">₹{(amount % 100).toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {/* Voice Hints */}
      <div className="voice-hints">
        <p className="hint-title">🎤 Voice Commands:</p>
        <ul className="hint-list">
          <li>"Add 50 rupees" / "ஐம்பது ரூபாய் சேர்"</li>
          <li>"Empty pot" / "பானை காலி செய்"</li>
        </ul>
      </div>
    </div>
  );
};

export default CashPot;