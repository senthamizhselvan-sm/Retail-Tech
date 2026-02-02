import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import inventoryService, { InventoryItem } from '../services/inventoryService';
import api from '../services/api';

interface DiscountPrediction {
  productId: string;
  productName: string;
  currentPrice: number;
  suggestedDiscount: number;
  finalPrice: number;
  expectedProfit: number;
  expectedLoss: number;
  marketPrice: number;
  recommendation: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  profitMargin: number;
}

interface ActiveOffer {
  id: string;
  productId: string;
  productName: string;
  originalPrice: number;
  discountPercent: number;
  finalPrice: number;
  status: 'ACTIVE' | 'PAUSED';
  createdAt: string;
}

const SimplifiedOfferPlanning: React.FC = () => {
  const { } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(5);
  const [predictions, setPredictions] = useState<DiscountPrediction[]>([]);
  const [activeOffers, setActiveOffers] = useState<ActiveOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    loadInventoryData();
    loadActiveOffers();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const inventoryResponse = await inventoryService.getInventory();
      // Only show products with pricing data for offer planning
      const pricedProducts = inventoryResponse.data.filter((item: any) =>
        item.sellingPrice && item.sellingPrice > 0 &&
        item.costPrice && item.costPrice > 0
      );
      setInventory(pricedProducts);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveOffers = async () => {
    try {
      // Load any existing active offers (would come from backend)
      setActiveOffers([]);
    } catch (error) {
      console.error('Failed to load active offers:', error);
    }
  };

  const predictDiscountImpact = async () => {
    if (selectedProducts.length === 0 || !discountAmount) {
      alert('Please select products and set discount amount');
      return;
    }

    setPredicting(true);
    try {
      const response = await fetch('/api/planning/predict-discount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productIds: selectedProducts,
          discountPercent: discountAmount
        })
      });

      if (response.ok) {
        const result = await response.json();
        const predictions: DiscountPrediction[] = result.predictions.map((p: any) => ({
          productId: p.productId,
          productName: p.productName,
          currentPrice: p.currentPrice,
          suggestedDiscount: p.suggestedDiscount,
          finalPrice: p.finalPrice,
          expectedProfit: p.profitPerUnit,
          expectedLoss: p.expectedLoss,
          marketPrice: p.marketPrice,
          recommendation: p.recommendation,
          riskLevel: p.riskLevel,
          profitMargin: p.profitMargin
        }));
        
        setPredictions(predictions);
      } else {
        throw new Error('Failed to get predictions');
      }
    } catch (error) {
      console.error('Failed to predict discount impact:', error);
      
      // Fallback to client-side calculation
      const selectedInventoryItems = inventory.filter(item => 
        selectedProducts.includes(item._id)
      );

      const fallbackPredictions: DiscountPrediction[] = selectedInventoryItems.map(product => {
        const finalPrice = product.sellingPrice! * (1 - discountAmount / 100);
        const profit = finalPrice - product.costPrice!;
        const profitMargin = ((finalPrice - product.costPrice!) / product.costPrice!) * 100;

        return {
          productId: product._id,
          productName: product.productName,
          currentPrice: product.sellingPrice!,
          suggestedDiscount: discountAmount,
          finalPrice,
          expectedProfit: profit,
          expectedLoss: profit < 0 ? Math.abs(profit) : 0,
          marketPrice: product.sellingPrice!,
          recommendation: profit > 0 ? 'Safe discount - positive margin maintained' : 'Risky - may cause losses',
          riskLevel: profit > 0 ? 'LOW' : 'HIGH',
          profitMargin
        };
      });
      
      setPredictions(fallbackPredictions);
    } finally {
      setPredicting(false);
    }
  };

  const applyOffer = async (prediction: DiscountPrediction) => {
    if (prediction.expectedLoss > 0) {
      const confirmLoss = window.confirm(
        `This discount may cause a loss of ₹${prediction.expectedLoss.toFixed(2)} per unit. Do you want to continue?`
      );
      if (!confirmLoss) return;
    }

    try {
      const newOffer: ActiveOffer = {
        id: Date.now().toString(),
        productId: prediction.productId,
        productName: prediction.productName,
        originalPrice: prediction.currentPrice,
        discountPercent: discountAmount,
        finalPrice: prediction.finalPrice,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };

      setActiveOffers([...activeOffers, newOffer]);
      
      // Remove from predictions
      setPredictions(predictions.filter(p => p.productId !== prediction.productId));
      setSelectedProducts(selectedProducts.filter(id => id !== prediction.productId));
      
      alert(`Offer applied successfully for ${prediction.productName}!`);
    } catch (error) {
      console.error('Failed to apply offer:', error);
      alert('Failed to apply offer');
    }
  };

  const removeOffer = async (offerId: string) => {
    setActiveOffers(activeOffers.filter(offer => offer.id !== offerId));
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return '#10B981';
      case 'MEDIUM': return '#F59E0B';
      case 'HIGH': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getProductsByCategory = () => {
    const grouped: { [key: string]: InventoryItem[] } = {};
    inventory.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(item);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-xxl)', textAlign: 'center' }}>
        <h2>Loading inventory...</h2>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xxl)', paddingBottom: 'var(--spacing-xxl)' }}>
      <div className="fade-in">
        <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>
          Offer Planning
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xxl)' }}>
          Set smart discounts with AI-powered profit/loss predictions
        </p>

        {/* Active Offers Section */}
        {activeOffers.length > 0 && (
          <div className="card slide-up" style={{ marginBottom: 'var(--spacing-xxl)' }}>
            <h2>🎯 Active Offers</h2>
            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
              {activeOffers.map(offer => (
                <div key={offer.id} style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--color-background-secondary)',
                  borderRadius: 'var(--border-radius)',
                  border: '2px solid #10B981',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4>{offer.productName}</h4>
                    <p>
                      <span style={{ textDecoration: 'line-through' }}>₹{offer.originalPrice}</span>
                      {' → '}
                      <strong style={{ color: '#10B981' }}>₹{offer.finalPrice.toFixed(2)}</strong>
                      {' '}({offer.discountPercent}% off)
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="btn btn-primary" style={{ fontSize: '14px' }}>
                      {offer.status}
                    </button>
                    <button 
                      onClick={() => removeOffer(offer.id)}
                      className="btn btn-danger" 
                      style={{ fontSize: '14px' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offer Planning Section */}
        <div className="card slide-up" style={{ marginBottom: 'var(--spacing-xxl)' }}>
          <h2>📊 Plan New Offer</h2>
          
          {/* Discount Setting */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
              Set Discount Percentage:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <input
                type="range"
                min="1"
                max="50"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <div style={{ 
                minWidth: '80px', 
                fontSize: '24px', 
                fontWeight: 'bold',
                color: discountAmount <= 10 ? '#10B981' : discountAmount <= 25 ? '#F59E0B' : '#EF4444'
              }}>
                {discountAmount}%
              </div>
            </div>
            <div style={{ marginTop: 'var(--spacing-xs)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {discountAmount <= 10 && '✅ Safe discount range'}
              {discountAmount > 10 && discountAmount <= 25 && '⚠️ Moderate discount - check profit margins'}
              {discountAmount > 25 && '🚨 High discount - may cause losses'}
            </div>
          </div>

          {/* Product Selection by Category */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3>Select Products for Offer:</h3>
            {Object.entries(getProductsByCategory()).map(([category, products]) => (
              <div key={category} style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h4 style={{ 
                  marginBottom: 'var(--spacing-md)',
                  padding: 'var(--spacing-sm)',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: 'var(--border-radius)'
                }}>
                  {category}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
                  {products.map(product => (
                    <div 
                      key={product._id}
                      onClick={() => {
                        const newSelection = selectedProducts.includes(product._id)
                          ? selectedProducts.filter(id => id !== product._id)
                          : [...selectedProducts, product._id];
                        setSelectedProducts(newSelection);
                      }}
                      style={{
                        padding: 'var(--spacing-md)',
                        border: `2px solid ${selectedProducts.includes(product._id) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--border-radius)',
                        backgroundColor: selectedProducts.includes(product._id) ? 'var(--color-primary-light)' : 'var(--color-background)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ marginBottom: 'var(--spacing-xs)' }}>{product.productName}</h4>
                          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                            Stock: {product.quantity} {product.unit}
                          </p>
                          <div style={{ marginTop: 'var(--spacing-sm)' }}>
                            <div>Cost: ₹{product.costPrice}</div>
                            <div>Selling: ₹{product.sellingPrice}</div>
                            <div style={{ 
                              fontWeight: 'bold',
                              color: ((product.sellingPrice! - product.costPrice!) / product.costPrice!) * 100 > 20 ? '#10B981' : '#F59E0B'
                            }}>
                              Margin: {(((product.sellingPrice! - product.costPrice!) / product.costPrice!) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div style={{ 
                          width: '24px', 
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: selectedProducts.includes(product._id) ? 'var(--color-primary)' : 'transparent',
                          border: '2px solid var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {selectedProducts.includes(product._id) && (
                            <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Predict Button */}
          <button
            onClick={predictDiscountImpact}
            disabled={selectedProducts.length === 0 || predicting}
            className="btn btn-primary"
            style={{ 
              width: '100%',
              fontSize: '18px',
              padding: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-lg)'
            }}
          >
            {predicting ? '🔮 Getting AI Predictions...' : '🤖 Get AI Profit/Loss Predictions'}
          </button>
        </div>

        {/* Predictions Section */}
        {predictions.length > 0 && (
          <div className="card slide-up">
            <h2>🔮 AI Predictions & Recommendations</h2>
            <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
              {predictions.map(prediction => (
                <div 
                  key={prediction.productId}
                  style={{
                    padding: 'var(--spacing-lg)',
                    border: `2px solid ${getRiskColor(prediction.riskLevel)}`,
                    borderRadius: 'var(--border-radius)',
                    backgroundColor: 'var(--color-background-secondary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                    <div>
                      <h3>{prediction.productName}</h3>
                      <div style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        backgroundColor: getRiskColor(prediction.riskLevel),
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'inline-block',
                        marginTop: 'var(--spacing-xs)'
                      }}>
                        {prediction.riskLevel} RISK
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                    gap: 'var(--spacing-md)', 
                    marginBottom: 'var(--spacing-md)',
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'var(--color-background)',
                    borderRadius: 'var(--border-radius)'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <strong>Current Price</strong>
                      <div style={{ fontSize: '20px', color: 'var(--color-text-primary)' }}>
                        ₹{prediction.currentPrice.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong>After {discountAmount}% Off</strong>
                      <div style={{ fontSize: '20px', color: 'var(--color-primary)' }}>
                        ₹{prediction.finalPrice.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong>Market Price</strong>
                      <div style={{ fontSize: '20px', color: 'var(--color-text-secondary)' }}>
                        ₹{prediction.marketPrice.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong>Profit per Unit</strong>
                      <div style={{ 
                        fontSize: '20px', 
                        color: prediction.expectedProfit > 0 ? '#10B981' : '#EF4444',
                        fontWeight: 'bold'
                      }}>
                        {prediction.expectedProfit > 0 ? '+' : ''}₹{prediction.expectedProfit.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  <div style={{ 
                    padding: 'var(--spacing-md)', 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                    borderRadius: 'var(--border-radius)',
                    marginBottom: 'var(--spacing-md)'
                  }}>
                    <h4>🤖 AI Recommendation:</h4>
                    <p style={{ marginBottom: 'var(--spacing-sm)' }}>{prediction.recommendation}</p>
                    {prediction.suggestedDiscount !== discountAmount && (
                      <p style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>
                        💡 Suggested optimal discount: {prediction.suggestedDiscount}%
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <button
                      onClick={() => applyOffer(prediction)}
                      className="btn btn-primary"
                      style={{ 
                        flex: 1,
                        backgroundColor: prediction.riskLevel === 'HIGH' ? '#F59E0B' : '#10B981',
                        borderColor: prediction.riskLevel === 'HIGH' ? '#F59E0B' : '#10B981'
                      }}
                    >
                      {prediction.riskLevel === 'HIGH' ? '⚠️ Apply Risky Offer' : '✅ Apply Safe Offer'}
                    </button>
                    {prediction.suggestedDiscount !== discountAmount && (
                      <button
                        onClick={() => {
                          setDiscountAmount(prediction.suggestedDiscount);
                          // Re-predict with new discount will happen when user clicks predict again
                        }}
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                      >
                        📈 Use {prediction.suggestedDiscount}%
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Products Message */}
        {inventory.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>📦</div>
            <h3>No Products Available</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Add products with cost and selling prices to start planning offers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplifiedOfferPlanning;