import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import inventoryService, { InventoryItem } from '../services/inventoryService';
import planningService, { OfferRecommendationsResponse, ProductOfferData, PricingData } from '../services/planningService';

// READ-ONLY: Calendar suggestions (never stored as plans)
interface PlanningEvent {
  date: string;
  type: 'festival' | 'salary' | 'market' | 'custom';
  name: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
}

// USER-CREATED: Actual offer plans (created only via modal)
interface OfferPlan {
  id: string;
  name: string;
  title: string;
  targetDate: string;
  products: string[];
  offerType: 'discount' | 'combo' | 'bundle' | 'clearance';
  goal: 'increase_sales' | 'clear_stock' | 'increase_visibility';
  discountRange?: string;
  status: 'planned' | 'locked';
  aiSuggestion: string;
  createdAt?: string;
}

const OfferPlanning: React.FC = () => {
  const { } = useAuth();
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [expandedEvent, setExpandedEvent] = useState<string>('');
  
  // Offer plans state (starts EMPTY)
  const [offerPlans, setOfferPlans] = useState<OfferPlan[]>([]);
  
  // Modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [offerTitle, setOfferTitle] = useState<string>('');
  const [offerType, setOfferType] = useState<'discount' | 'combo' | 'bundle' | 'clearance'>('discount');
  const [offerGoal, setOfferGoal] = useState<'increase_sales' | 'clear_stock' | 'increase_visibility'>('increase_sales');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Inventory and loading state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // AI Offer Recommendations State
  const [aiRecommendations, setAiRecommendations] = useState<OfferRecommendationsResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedProductForPricing, setSelectedProductForPricing] = useState<InventoryItem | null>(null);
  const [pricingFormData, setPricingFormData] = useState<PricingData>({});

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Load inventory data on component mount
  useEffect(() => {
    loadInventoryData();
    loadAiRecommendations();
  }, []);

  // Generate calendar events when month changes
  useEffect(() => {
    generateCalendarEvents();
  }, [currentMonth, currentYear]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const inventoryResponse = await inventoryService.getInventory();
      setInventory(inventoryResponse.data);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  // Load AI-powered offer recommendations
  const loadAiRecommendations = async (category?: string) => {
    setAiLoading(true);
    try {
      const recommendations = await planningService.getOfferRecommendations(category);
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Failed to load AI recommendations:', error);
      setAiRecommendations({
        success: false,
        data: [],
        marketInsight: {
          category: 'General',
          insight: 'Unable to load market insights. Please check your internet connection.',
          dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          monthName: new Date().toLocaleDateString('en-US', { month: 'long' }),
          isSalaryTime: false,
          isWeekend: false,
          generatedAt: new Date().toISOString(),
          fallback: true
        },
        summary: { totalProducts: 0, productsWithOffers: 0, safeOffers: 0, riskyOffers: 0 },
        hasData: false,
        generatedAt: new Date().toISOString(),
        message: 'Failed to load recommendations'
      } as OfferRecommendationsResponse);
    } finally {
      setAiLoading(false);
    }
  };

  // Handle category filter change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    loadAiRecommendations(category || undefined);
  };

  // Get unique categories from inventory
  const getCategories = (): string[] => {
    const categories = inventory
      .map(item => item.category)
      .filter((category): category is string => !!category)
      .filter((category, index, arr) => arr.indexOf(category) === index)
      .sort();
    return categories;
  };

  // Open pricing modal
  const openPricingModal = (product: InventoryItem | null) => {
    if (!product) return;
    
    setSelectedProductForPricing(product);
    setPricingFormData({
      costPrice: product.costPrice || undefined,
      sellingPrice: product.sellingPrice || undefined,
      mrp: product.mrp || undefined
    });
    setShowPricingModal(true);
  };

  // Save pricing data
  const savePricingData = async () => {
    if (!selectedProductForPricing) return;

    const validation = planningService.validatePricingData(pricingFormData);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    try {
      setLoading(true);
      await planningService.updateProductPricing(selectedProductForPricing._id, pricingFormData);
      
      // Refresh inventory and recommendations
      await loadInventoryData();
      await loadAiRecommendations(selectedCategory || undefined);
      
      setShowPricingModal(false);
      setSelectedProductForPricing(null);
      setPricingFormData({});
      
      alert('Pricing updated successfully!');
    } catch (error: any) {
      console.error('Failed to update pricing:', error);
      alert(error.message || 'Failed to update pricing');
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar events (READ-ONLY suggestions)
  const generateCalendarEvents = () => {
    const events: PlanningEvent[] = [];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Festival days (sample for different months)
    const festivals = {
      0: [{ day: 26, name: 'Republic Day' }], // January
      2: [{ day: 8, name: 'Holi' }], // March
      7: [{ day: 15, name: 'Independence Day' }], // August
      9: [{ day: 2, name: 'Gandhi Jayanti' }, { day: 24, name: 'Diwali' }], // October
      10: [{ day: 12, name: 'Diwali' }, { day: 19, name: 'Bhai Dooj' }] // November
    };

    // Add festivals
    if (festivals[currentMonth as keyof typeof festivals]) {
      festivals[currentMonth as keyof typeof festivals].forEach(festival => {
        events.push({
          date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(festival.day).padStart(2, '0')}`,
          type: 'festival',
          name: festival.name,
          impact: 'high',
          suggestion: `High demand expected for festive items. Consider special offers and increased stock.`
        });
      });
    }

    // Salary cycles (1st, 15th, 30th)
    [1, 15, Math.min(30, daysInMonth)].forEach(day => {
      events.push({
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        type: 'salary',
        name: day === 1 ? 'Month Start - Salary Day' : day === 15 ? 'Mid-Month Salary' : 'Month End',
        impact: 'medium',
        suggestion: `Increased purchasing power. Good time for premium product offers and bulk deals.`
      });
    });

    // Market rush days (weekends)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      if (date.getDay() === 0 || date.getDay() === 6) { // Sunday or Saturday
        events.push({
          date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          type: 'market',
          name: date.getDay() === 0 ? 'Sunday Market' : 'Saturday Rush',
          impact: 'medium',
          suggestion: `Weekend shoppers browse more. Focus on family packs and bulk offers.`
        });
      }
    }

    setEvents(events.sort((a, b) => a.date.localeCompare(b.date)));
  };

  // Open plan creation modal
  const openPlanModal = (date: string, suggestedTitle: string) => {
    // Check for existing plan
    const existingPlan = getExistingPlanForDate(date);
    if (existingPlan) {
      alert(`An offer is already planned for this date: "${existingPlan.name}". You can edit or delete it from the Offer Plans section.`);
      return;
    }

    setSelectedDate(date);
    setOfferTitle(suggestedTitle);
    setOfferType('discount');
    setOfferGoal('increase_sales');
    setSelectedProducts([]);
    setShowPlanModal(true);
  };

  // Close modal and reset state
  const closePlanModal = () => {
    setShowPlanModal(false);
    resetModalForm();
  };

  const resetModalForm = () => {
    setSelectedDate('');
    setOfferTitle('');
    setOfferType('discount');
    setOfferGoal('increase_sales');
    setSelectedProducts([]);
  };

  // Generate fallback AI suggestion
  const generateFallbackSuggestion = (event?: PlanningEvent): string => {
    if (!event) return 'Consider running a general promotion to boost sales.';

    switch (event.type) {
      case 'festival':
        return `Festival season! Offer 10-20% discounts on sweets, decorative items, and gift packs. Create festive bundles.`;
      case 'salary':
        return `Salary day advantage! Promote premium products with 5-15% discounts. Focus on monthly essentials.`;
      case 'market':
        return `Weekend rush! Offer family packs and bulk discounts. 'Buy 2 Get 1' works well on weekends.`;
      default:
        return `Regular day promotion. Consider 5-10% discount on fast-moving items to maintain momentum.`;
    }
  };

  // Generate smart AI suggestion using Gemini (text-only)
  const generateSmartOfferSuggestion = async (date: string, event?: PlanningEvent): Promise<string> => {
    try {
      const inventorySummary = inventory.map(item => 
        `- ${item.productName}: ${item.stockStatus}`
      ).join('\n');

      const eventContext = event ? `Event Type: ${event.type} (${event.name})` : 'Regular day';

      const prompt = `You are a retail offer planning assistant for a small shop in India.

Context:
Date: ${date}
${eventContext}
Inventory Summary:
${inventorySummary || '- No inventory data available'}

Suggest:
1. One offer idea
2. One pricing or combo tip

Rules:
- No auto pricing
- No guarantees
- Simple business language
- Keep response under 100 words`;

      const response = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ prompt })
      });

      if (response.ok) {
        const result = await response.json();
        return result.text || generateFallbackSuggestion(event);
      }
    } catch (error) {
      console.error('AI suggestion failed:', error);
    }

    // Fallback to existing rule-based suggestion
    return generateFallbackSuggestion(event);
  };

  // Create new offer plan
  const createOfferPlan = async () => {
    if (!offerTitle.trim()) {
      alert('Please enter an offer title');
      return;
    }

    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    // Check for existing plan
    const existingPlan = getExistingPlanForDate(selectedDate);
    if (existingPlan) {
      alert('An offer already exists for this date. Please edit or delete the existing plan.');
      return;
    }

    try {
      setLoading(true);

      // Generate AI suggestion
      const event = events.find(e => e.date === selectedDate);
      const aiSuggestion = await generateSmartOfferSuggestion(selectedDate, event);

      // Create new plan
      const newPlan: OfferPlan = {
        id: `plan_${Date.now()}`,
        name: offerTitle,
        title: offerTitle,
        targetDate: selectedDate,
        products: [...selectedProducts],
        offerType: offerType,
        goal: offerGoal,
        status: 'planned',
        aiSuggestion,
        createdAt: new Date().toISOString()
      };

      // Add to plans
      setOfferPlans(prevPlans => [...prevPlans, newPlan]);
      
      closePlanModal();
      
    } catch (error) {
      console.error('Failed to create offer plan:', error);
      alert('Failed to create offer plan');
    } finally {
      setLoading(false);
    }
  };

  // Toggle product selection in modal
  const handleProductToggle = (productName: string) => {
    setSelectedProducts(prev => 
      prev.includes(productName)
        ? prev.filter(p => p !== productName)
        : [...prev, productName]
    );
  };

  // Get product stock warning
  const getProductStockWarning = (productName: string): string | null => {
    const product = inventory.find(item => item.productName === productName);
    if (product && (product.stockStatus === 'LOW_STOCK' || product.stockStatus === 'OUT_OF_STOCK')) {
      return `⚠️ ${product.stockStatus === 'OUT_OF_STOCK' ? 'Out of stock' : 'Low stock'} - Consider restocking first`;
    }
    return null;
  };

  // Lock a plan
  const lockPlan = (planId: string) => {
    setOfferPlans(prevPlans => 
      prevPlans.map(plan => 
        plan.id === planId ? { ...plan, status: 'locked' } : plan
      )
    );
  };

  // Delete a plan
  const deletePlan = (planId: string) => {
    setOfferPlans(prevPlans => prevPlans.filter(plan => plan.id !== planId));
  };

  // Check if date has existing plan
  const getExistingPlanForDate = (date: string): OfferPlan | undefined => {
    return offerPlans.find(plan => plan.targetDate === date);
  };

  // Get color for event type
  const getEventColor = (type: string) => {
    switch (type) {
      case 'festival': return '#EF4444';
      case 'salary': return '#10B981';
      case 'market': return '#3B82F6';
      case 'custom': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  // Get color for impact level
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xxl)', paddingBottom: 'var(--spacing-xxl)' }}>
      <div className="fade-in">
        <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>
          Smart Offer Planning
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xxl)' }}>
          Plan strategic offers based on calendar insights and AI recommendations
        </p>

        {/* Month Navigation */}
        <div className="card slide-up" style={{ marginBottom: 'var(--spacing-xxl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
            <h2>📅 Planning Calendar</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <button 
                onClick={() => setCurrentMonth(currentMonth === 0 ? 11 : currentMonth - 1)}
                className="btn btn-secondary"
              >
                ← Previous
              </button>
              <h3>{monthNames[currentMonth]} {currentYear}</h3>
              <button 
                onClick={() => setCurrentMonth(currentMonth === 11 ? 0 : currentMonth + 1)}
                className="btn btn-secondary"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Events Timeline */}
          <div style={{ 
            display: 'grid', 
            gap: 'var(--spacing-md)',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {events.map((event, index) => {
              const existingPlan = getExistingPlanForDate(event.date);
              return (
                <div key={index} style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--color-background)',
                  borderRadius: 'var(--border-radius)',
                  border: `2px solid ${getEventColor(event.type)}20`,
                  borderLeft: `4px solid ${getEventColor(event.type)}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ minWidth: '80px', fontWeight: 'bold' }}>
                      {new Date(event.date).getDate()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                        <h4 style={{ margin: 0 }}>{event.name}</h4>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: 'white',
                          backgroundColor: getImpactColor(event.impact)
                        }}>
                          {event.impact.toUpperCase()}
                        </span>
                        {existingPlan && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: 'white',
                            backgroundColor: '#10B981'
                          }}>
                            PLANNED
                          </span>
                        )}
                      </div>
                      <p style={{ 
                        fontSize: '14px', 
                        color: 'var(--color-text-secondary)', 
                        margin: 0 
                      }}>
                        {event.suggestion}
                      </p>
                      
                      {/* Why This Day Matters - Expandable */}
                      {expandedEvent === event.date && (
                        <div style={{
                          marginTop: 'var(--spacing-sm)',
                          padding: 'var(--spacing-sm)',
                          backgroundColor: '#f0f8ff',
                          borderRadius: '4px',
                          fontSize: '12px',
                          borderLeft: '3px solid #2196F3'
                        }}>
                          <strong>💡 Why plan an offer today?</strong><br/>
                          {event.type === 'festival' && 'Festivals drive 40% more footfall. Customers expect deals and are willing to spend more on celebration items.'}
                          {event.type === 'salary' && 'Fresh salary = higher purchasing power. Perfect time to promote premium or bulk items with attractive offers.'}
                          {event.type === 'market' && 'Weekend shoppers browse more and buy in larger quantities. Family-focused offers work best.'}
                          {event.type === 'custom' && 'Strategic timing can help you stand out when competitors aren\'t running promotions.'}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                      <button 
                        onClick={() => setExpandedEvent(expandedEvent === event.date ? '' : event.date)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        {expandedEvent === event.date ? 'Hide' : 'Why?'}
                      </button>
                      <button 
                        onClick={() => openPlanModal(event.date, `${event.name} Special Offer`)}
                        className="btn btn-primary"
                        style={{ 
                          fontSize: '14px',
                          opacity: existingPlan ? 0.6 : 1
                        }}
                      >
                        {existingPlan ? 'Offer Planned' : 'Plan Offer'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI-Powered Offer Recommendations */}
        <div className="card slide-up" style={{ marginBottom: 'var(--spacing-xxl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
            <h2>🤖 AI Offer Recommendations</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <select 
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                style={{
                  padding: 'var(--spacing-sm)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--border-radius)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="">All Categories</option>
                {getCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <button 
                onClick={() => loadAiRecommendations(selectedCategory || undefined)}
                disabled={aiLoading}
                className="btn btn-secondary"
                style={{ opacity: aiLoading ? 0.6 : 1 }}
              >
                {aiLoading ? '🔄' : '🔄'} Refresh
              </button>
            </div>
          </div>

          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>🧠</div>
              <h3>AI is analyzing market trends...</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Generating safe, profitable offer recommendations
              </p>
            </div>
          ) : !aiRecommendations?.hasData ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>📊</div>
              <h3>Add pricing data to get AI recommendations</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                Products need cost prices for safe offer planning
              </p>
              
              {inventory.filter(item => !item.costPrice || item.costPrice <= 0).length > 0 && (
                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                  <h4>Products missing pricing data:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                    {inventory.filter(item => !item.costPrice || item.costPrice <= 0).slice(0, 6).map(product => (
                      <div 
                        key={product._id}
                        style={{
                          padding: 'var(--spacing-md)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--border-radius)',
                          backgroundColor: 'var(--color-background-secondary)'
                        }}
                      >
                        <h4>{product.productName}</h4>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                          {product.category || 'Uncategorized'}
                        </p>
                        <button 
                          onClick={() => openPricingModal(product)}
                          className="btn btn-primary"
                          style={{ marginTop: 'var(--spacing-sm)', width: '100%' }}
                        >
                          Add Pricing
                        </button>
                      </div>
                    ))}
                  </div>
                  {inventory.filter(item => !item.costPrice || item.costPrice <= 0).length > 6 && (
                    <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                      And {inventory.filter(item => !item.costPrice || item.costPrice <= 0).length - 6} more products...
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Market Insights */}
              {aiRecommendations?.marketInsight && (
                <div style={{ 
                  padding: 'var(--spacing-lg)', 
                  backgroundColor: 'var(--color-background-secondary)', 
                  borderRadius: 'var(--border-radius)',
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  <h3 style={{ marginBottom: 'var(--spacing-md)' }}>📈 Market Analysis</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <strong>{aiRecommendations.marketInsight.dayOfWeek}</strong>
                      <br />
                      <small>Today</small>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong>{aiRecommendations.marketInsight.monthName}</strong>
                      <br />
                      <small>Month</small>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong>{aiRecommendations.marketInsight.isSalaryTime ? '💰' : '📅'}</strong>
                      <br />
                      <small>{aiRecommendations.marketInsight.isSalaryTime ? 'Salary Time' : 'Regular Day'}</small>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong>{aiRecommendations.marketInsight.isWeekend ? '🛒' : '🏢'}</strong>
                      <br />
                      <small>{aiRecommendations.marketInsight.isWeekend ? 'Weekend Rush' : 'Weekday'}</small>
                    </div>
                  </div>
                  <p style={{ color: 'var(--color-text-primary)', fontStyle: 'italic' }}>
                    "{aiRecommendations.marketInsight.insight.substring(0, 200)}"
                  </p>
                  {aiRecommendations.marketInsight.fallback && (
                    <small style={{ color: 'var(--color-warning)' }}>
                      ⚠️ Using fallback analysis - AI service temporarily unavailable
                    </small>
                  )}
                </div>
              )}

              {/* Summary Stats */}
              {aiRecommendations?.summary && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                  gap: 'var(--spacing-md)', 
                  marginBottom: 'var(--spacing-lg)' 
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--color-primary)' }}>{aiRecommendations.summary.totalProducts}</h3>
                    <small>Products Analyzed</small>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ color: planningService.getMarginStatusColor('SAFE') }}>{aiRecommendations.summary.safeOffers}</h3>
                    <small>Safe Offers</small>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ color: planningService.getRiskLevelColor('HIGH') }}>{aiRecommendations.summary.riskyOffers}</h3>
                    <small>High Risk</small>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--color-text-primary)' }}>{aiRecommendations.summary.productsWithOffers}</h3>
                    <small>With Offers</small>
                  </div>
                </div>
              )}

              {/* Product Recommendations */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-lg)' }}>
                {aiRecommendations?.data.map((product: ProductOfferData) => (
                  <div 
                    key={product.productId}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--border-radius)',
                      padding: 'var(--spacing-lg)',
                      backgroundColor: 'var(--color-background)',
                      borderLeft: `4px solid ${planningService.getMarginStatusColor(product.recommendation.marginStatus)}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                      <div>
                        <h4 style={{ marginBottom: 'var(--spacing-xs)' }}>{product.productName}</h4>
                        <small style={{ color: 'var(--color-text-secondary)' }}>
                          {product.category || 'Uncategorized'} • Stock: {product.currentQuantity}
                        </small>
                      </div>
                      <div style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        backgroundColor: planningService.getRiskLevelColor(product.recommendation.riskLevel),
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {product.recommendation.riskLevel}
                      </div>
                    </div>

                    {/* Pricing Info */}
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-sm)', fontSize: '14px' }}>
                        <div>
                          <strong>Cost:</strong> ₹{product.pricing.costPrice}
                        </div>
                        <div>
                          <strong>Selling:</strong> ₹{product.pricing.sellingPrice || 'N/A'}
                        </div>
                        <div>
                          <strong>MRP:</strong> ₹{product.pricing.mrp || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* AI Recommendation */}
                    <div style={{ 
                      padding: 'var(--spacing-md)', 
                      backgroundColor: 'var(--color-background-secondary)', 
                      borderRadius: 'var(--border-radius)',
                      marginBottom: 'var(--spacing-md)'
                    }}>
                      <h5 style={{ marginBottom: 'var(--spacing-sm)' }}>🤖 AI Recommendation</h5>
                      
                      {product.recommendation.finalPrice ? (
                        <div>
                          <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <strong>Offer:</strong> {product.recommendation.recommendedDiscount}
                          </p>
                          <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <strong>Final Price:</strong> ₹{product.recommendation.finalPrice}
                          </p>
                          <p style={{ 
                            color: planningService.getMarginStatusColor(product.recommendation.marginStatus),
                            fontWeight: 'bold',
                            marginBottom: 'var(--spacing-sm)'
                          }}>
                            {product.recommendation.marginStatus}
                          </p>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>
                          {product.recommendation.recommendedDiscount}
                        </p>
                      )}
                      
                      <p style={{ fontSize: '14px', fontStyle: 'italic' }}>
                        "{product.recommendation.reason}"
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      <button 
                        onClick={() => {
                          const inventoryItem = inventory.find(item => item._id === product.productId);
                          if (inventoryItem) openPricingModal(inventoryItem);
                        }}
                        className="btn btn-secondary"
                        style={{ flex: 1, fontSize: '14px' }}
                      >
                        Edit Pricing
                      </button>
                      {product.recommendation.finalPrice && (
                        <button 
                          className="btn btn-primary"
                          style={{ flex: 1, fontSize: '14px' }}
                          onClick={() => {
                            alert(`Apply offer: ${product.recommendation.recommendedDiscount} on ${product.productName}. Final price: ₹${product.recommendation.finalPrice}`);
                          }}
                        >
                          Apply Offer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {aiRecommendations?.data.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
                  <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>🎯</div>
                  <h3>No products found in this category</h3>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    Try selecting a different category or add more products with pricing data.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Offer Plans Section */}
        <div className="card slide-up">
          <h2>🎯 Created Offer Plans</h2>
          
          {offerPlans.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--spacing-xxl)',
              color: 'var(--color-text-secondary)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>📋</div>
              <h3>No offer plans created yet</h3>
              <p>Click "Plan Offer" on calendar events to create your first offer plan.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
              {offerPlans.map(plan => (
                <div 
                  key={plan.id}
                  style={{
                    padding: 'var(--spacing-lg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)',
                    backgroundColor: plan.status === 'locked' ? '#f0f9ff' : 'var(--color-background-secondary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                    <div>
                      <h3>{plan.name}</h3>
                      <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 var(--spacing-sm) 0' }}>
                        📅 {new Date(plan.targetDate).toLocaleDateString()} • 
                        🎯 {plan.goal.replace('_', ' ')} • 
                        🏷️ {plan.offerType}
                      </p>
                      <div style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        backgroundColor: plan.status === 'locked' ? '#10B981' : '#F59E0B',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'inline-block'
                      }}>
                        {plan.status.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  {plan.products.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <h4>Products:</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                        {plan.products.map((productName, idx) => (
                          <span 
                            key={idx}
                            style={{
                              padding: '2px 8px',
                              backgroundColor: 'var(--color-primary-light)',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            {productName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Suggestion */}
                  <div style={{ 
                    padding: 'var(--spacing-md)', 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                    borderRadius: 'var(--border-radius)',
                    marginBottom: 'var(--spacing-md)'
                  }}>
                    <h4>🤖 AI Recommendation:</h4>
                    <p style={{ margin: 0, fontStyle: 'italic' }}>{plan.aiSuggestion}</p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    {plan.status === 'planned' && (
                      <button
                        onClick={() => lockPlan(plan.id)}
                        className="btn btn-primary"
                      >
                        🔒 Lock Plan
                      </button>
                    )}
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="btn btn-danger"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plan Creation Modal */}
        {showPlanModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: 'var(--spacing-xxl)',
              borderRadius: 'var(--border-radius)',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h2>Create Offer Plan</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                📅 {new Date(selectedDate).toLocaleDateString()}
              </p>

              {/* Offer Title */}
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
                  Offer Title *
                </label>
                <input
                  type="text"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder="Enter offer title"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)'
                  }}
                />
              </div>

              {/* Offer Type */}
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
                  Offer Type
                </label>
                <select
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)'
                  }}
                >
                  <option value="discount">Discount</option>
                  <option value="combo">Combo Offer</option>
                  <option value="bundle">Bundle Deal</option>
                  <option value="clearance">Clearance Sale</option>
                </select>
              </div>

              {/* Goal */}
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
                  Goal
                </label>
                <select
                  value={offerGoal}
                  onChange={(e) => setOfferGoal(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)'
                  }}
                >
                  <option value="increase_sales">Increase Sales</option>
                  <option value="clear_stock">Clear Stock</option>
                  <option value="increase_visibility">Increase Visibility</option>
                </select>
              </div>

              {/* Product Selection */}
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
                  Select Products (Optional)
                </label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-md)' }}>
                  {inventory.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>No products available</p>
                  ) : (
                    inventory.map(product => {
                      const warning = getProductStockWarning(product.productName);
                      return (
                        <div key={product._id} style={{ marginBottom: 'var(--spacing-xs)' }}>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginBottom: warning ? '0' : 'var(--spacing-sm)',
                              cursor: 'pointer'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.productName)}
                              onChange={() => handleProductToggle(product.productName)}
                              style={{ marginRight: 'var(--spacing-sm)' }}
                            />
                            <span>{product.productName}</span>
                            <span style={{ color: 'var(--color-text-secondary)', marginLeft: 'var(--spacing-sm)' }}>
                              (Stock: {product.quantity})
                            </span>
                          </label>
                          {warning && (
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#e74c3c', 
                              marginLeft: '20px',
                              marginBottom: 'var(--spacing-sm)',
                              fontStyle: 'italic'
                            }}>
                              {warning}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* AI Suggestions Preview */}
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h4>AI Recommendation Preview:</h4>
                <p style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontStyle: 'italic',
                  padding: 'var(--spacing-md)',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  lineHeight: '1.6',
                  fontSize: '14px',
                  border: '1px solid #e9ecef'
                }}>
                  {generateFallbackSuggestion(events.find(e => e.date === selectedDate))}
                  <br/><small>💡 Full AI suggestion will be generated when plan is created</small>
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                <button
                  onClick={closePlanModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={createOfferPlan}
                  className="btn btn-primary"
                  disabled={loading || !offerTitle.trim()}
                >
                  {loading ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Modal */}
        {showPricingModal && selectedProductForPricing && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: 'var(--spacing-xxl)',
              borderRadius: 'var(--border-radius)',
              width: '90%',
              maxWidth: '500px'
            }}>
              <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
                Update Pricing: {selectedProductForPricing.productName}
              </h3>
              
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                Add pricing data to enable AI-powered offer recommendations
              </p>
              
              {/* Cost Price */}
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 'bold' }}>
                  Cost Price (Required) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricingFormData.costPrice || ''}
                  onChange={(e) => setPricingFormData({
                    ...pricingFormData,
                    costPrice: e.target.value ? Number(e.target.value) : undefined
                  })}
                  placeholder="Enter cost price"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '16px'
                  }}
                />
                <small style={{ color: 'var(--color-text-secondary)' }}>
                  The actual cost you pay for this product
                </small>
              </div>

              {/* Selling Price */}
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 'bold' }}>
                  Selling Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricingFormData.sellingPrice || ''}
                  onChange={(e) => setPricingFormData({
                    ...pricingFormData,
                    sellingPrice: e.target.value ? Number(e.target.value) : undefined
                  })}
                  placeholder="Enter selling price"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '16px'
                  }}
                />
                <small style={{ color: 'var(--color-text-secondary)' }}>
                  Current price you sell to customers
                </small>
              </div>

              {/* MRP */}
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 'bold' }}>
                  MRP (Maximum Retail Price)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricingFormData.mrp || ''}
                  onChange={(e) => setPricingFormData({
                    ...pricingFormData,
                    mrp: e.target.value ? Number(e.target.value) : undefined
                  })}
                  placeholder="Enter MRP"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '16px'
                  }}
                />
                <small style={{ color: 'var(--color-text-secondary)' }}>
                  Maximum retail price (printed on product)
                </small>
              </div>

              {/* Validation Warning */}
              {pricingFormData.costPrice && pricingFormData.sellingPrice && 
               pricingFormData.sellingPrice < pricingFormData.costPrice && (
                <div style={{ 
                  padding: 'var(--spacing-md)', 
                  backgroundColor: '#fee', 
                  border: '1px solid #fcc',
                  borderRadius: 'var(--border-radius)',
                  marginBottom: 'var(--spacing-md)',
                  color: '#c33'
                }}>
                  ⚠️ Selling price cannot be less than cost price
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <button 
                  onClick={savePricingData}
                  disabled={loading || !pricingFormData.costPrice || pricingFormData.costPrice <= 0}
                  className="btn btn-primary"
                  style={{ 
                    flex: 1,
                    opacity: (loading || !pricingFormData.costPrice || pricingFormData.costPrice <= 0) ? 0.6 : 1,
                    cursor: (loading || !pricingFormData.costPrice || pricingFormData.costPrice <= 0) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Saving...' : 'Save Pricing'}
                </button>
                <button 
                  onClick={() => {
                    setShowPricingModal(false);
                    setSelectedProductForPricing(null);
                    setPricingFormData({});
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferPlanning;