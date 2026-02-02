import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BusinessService, { BusinessHealthData } from '../services/businessService';

const BusinessHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState<BusinessHealthData>({
    businessHealth: 'normal',
    salesTrend: 'stable', 
    priceStatus: 'competitive',
    offerFreshness: 'fresh',
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voiceSummary, setVoiceSummary] = useState<string>('');
  const [dailyAdvice, setDailyAdvice] = useState<any[]>([]);
  const [todayInsights, setTodayInsights] = useState<any>(null);
  const [businessTrends, setBusinessTrends] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch business health data
      const healthData = await BusinessService.getBusinessHealth();
      setHealthData(healthData);
      
      // Fetch voice summary
      const summaryData = await BusinessService.getVoiceSummary();
      setVoiceSummary(summaryData.text);
      
      // Fetch today's insights and advice
      await fetchTodayInsights();
      
      // Fetch business trends
      await fetchBusinessTrends();
      
    } catch (err: any) {
      console.error('Failed to fetch business data:', err);
      setError('Failed to load business data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayInsights = async () => {
    try {
      const response = await fetch('/api/assistant/today', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTodayInsights(data.data);
        
        // Extract key insights for daily advice
        const allInsights = [
          ...data.data.insights.stock || [],
          ...data.data.insights.visibility || [],
          ...data.data.insights.psychology || [],
          ...data.data.insights.timing || []
        ];
        
        setDailyAdvice(allInsights.slice(0, 4)); // Show top 4 insights
      }
    } catch (err) {
      console.error('Failed to fetch today insights:', err);
    }
  };

  const fetchBusinessTrends = async () => {
    try {
      // Generate business trends based on current date and time
      const now = new Date();
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = now.getHours();
      const month = now.toLocaleDateString('en-US', { month: 'long' });
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      const isMorning = hour >= 6 && hour < 12;
      const isAfternoon = hour >= 12 && hour < 17;
      const isEvening = hour >= 17 && hour < 21;
      
      // Generate real-time business trends
      const trends = {
        timeOfDay: {
          current: isMorning ? 'Morning' : isAfternoon ? 'Afternoon' : isEvening ? 'Evening' : 'Night',
          tip: isMorning ? '🌅 Morning rush - Keep breakfast items and newspapers ready!' : 
               isAfternoon ? '☀️ Afternoon lull - Perfect time to organize inventory and plan offers' :
               isEvening ? '🌆 Evening peak - Stock snacks and cold drinks for commuters' :
               '🌙 Night time - Focus on emergency items and late-night essentials'
        },
        dayType: {
          current: isWeekend ? 'Weekend' : 'Weekday',
          trend: isWeekend ? '📈 Higher family footfall expected' : '📊 Regular office-going customers',
          focus: isWeekend ? 'Family packs, snacks, cold drinks' : 'Quick essentials, newspapers, breakfast items'
        },
        seasonalFocus: {
          month: month,
          tips: getSeasonalTips(now.getMonth())
        },
        todaySpecial: generateTodaySpecial(dayOfWeek, hour),
        quickWins: generateQuickWins()
      };
      
      setBusinessTrends(trends);
    } catch (err) {
      console.error('Failed to fetch business trends:', err);
    }
  };

  const getSeasonalTips = (month: number) => {
    if (month >= 3 && month <= 6) {
      return ['🥤 Promote cold beverages', '🍦 Keep ice cream stocked', '🧊 Ice packs for coolers'];
    } else if (month >= 10 || month <= 1) {
      return ['☕ Hot beverages section', '🧣 Winter essentials', '🔥 Warm snacks display'];
    } else if (month >= 6 && month <= 9) {
      return ['☔ Umbrella displays', '🌧️ Monsoon essentials', '🏠 Indoor activities items'];
    }
    return ['🌸 Seasonal fresh items', '🎉 Festival preparations', '🛒 General promotions'];
  };

  const generateTodaySpecial = (day: string, hour: number) => {
    const specials = {
      Monday: '💪 Monday Motivation - Start week with energy drink offers',
      Tuesday: '🎯 Tuesday Targets - Focus on achieving daily sales goals', 
      Wednesday: '🐪 Hump Day - Mid-week snack promotions work well',
      Thursday: '🚀 Thursday Thrust - Prepare for weekend rush',
      Friday: '🎉 TGIF - Weekend shopping preparation items',
      Saturday: '👪 Family Saturday - Bulk offers and family packs',
      Sunday: '😌 Relaxed Sunday - Comfort foods and leisure items'
    };
    return specials[day as keyof typeof specials] || '📅 Make today count with great customer service!';
  };

  const generateQuickWins = () => {
    const tips = [
      '💡 Check if fast-moving items are visible from entrance',
      '🏷️ Update price tags for clarity and professional look', 
      '📱 Keep digital payment options ready and visible',
      '🧹 Quick 5-minute shop cleanup for better impression',
      '📝 Ask 3 customers about their experience today'
    ];
    return tips.slice(0, 3);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchBusinessData();
    setRefreshing(false);
  };

  const playVoiceSummary = () => {
    const summaryText = voiceSummary || `Today business looks ${healthData.businessHealth}. Sales trend is ${healthData.salesTrend} and your price position is ${healthData.priceStatus}.`;
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(summaryText);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'high': case 'up': case 'fresh': case 'competitive': return '#10B981';
      case 'normal': case 'stable': case 'premium': case 'aging': case 'mixed': return '#F59E0B';
      case 'low': case 'down': case 'stale': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'high': case 'up': case 'fresh': case 'competitive': return '📈';
      case 'normal': case 'stable': case 'premium': case 'aging': case 'mixed': return '📊';
      case 'low': case 'down': case 'stale': return '📉';
      default: return '📊';
    }
  };

  const formatDisplayText = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'daily-advice':
        navigate('/daily-assistant');
        break;
      case 'plan-offers':
        navigate('/offer-planning');
        break;
      case 'customer-replies':
        navigate('/customer-communication');
        break;
      case 'brand-settings':
        navigate('/business-profile');
        break;
      case 'inventory':
        navigate('/inventory');
        break;
      case 'vendor-assistant':
        navigate('/vendor-assistant');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '60px', textAlign: 'center' }}>
        <div className="fade-in">
          <h1 style={{ color: '#0F172A', fontSize: '32px', fontWeight: '600', marginBottom: '16px' }}>Loading Dashboard</h1>
          <div style={{ 
            width: '40px',
            height: '40px', 
            border: '3px solid #E5E7EB',
            borderTop: '3px solid #2563EB',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '60px', textAlign: 'center' }}>
        <div className="fade-in">
          <h1 style={{ color: '#DC2626', fontSize: '32px', fontWeight: '600', marginBottom: '16px' }}>Error Loading Data</h1>
          <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '14px' }}>
            {error}
          </p>
          <button 
            onClick={fetchBusinessData}
            style={{
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="business-home-container">
      <div className="container">
        <div className="fade-in">
          <div style={{ marginBottom: '48px' }}>
            <h1 style={{ 
              marginBottom: '4px',
              background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '34px',
              fontWeight: '700',
              lineHeight: '1.2'
            }}>
              Business Dashboard
            </h1>
            <p style={{ 
              color: '#64748B', 
              fontSize: '14px',
              margin: 0
            }}>
              Real-time performance monitoring for {user?.name}
            </p>
          </div>

          {/* Business Health Overview */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={{
                  color: '#0F172A',
                  fontSize: '24px',
                  fontWeight: '600',
                  marginBottom: '4px',
                  lineHeight: '1.3'
                }}>Business Health Overview</h2>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                  Last updated: {new Date(healthData.lastUpdated).toLocaleTimeString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={refreshData}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    color: '#374151',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  disabled={refreshing}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button 
                  onClick={playVoiceSummary}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    color: '#374151',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Audio Summary
                </button>
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '20px'
            }}>
              {/* Overall Health */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative' as const
              }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '4px',
                  height: '100%',
                  background: getHealthColor(healthData.businessHealth),
                  borderRadius: '12px 0 0 12px'
                }}></div>
                <div style={{ 
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#0F172A',
                  marginBottom: '4px'
                }}>
                  {formatDisplayText(healthData.businessHealth)}
                </div>
                <div style={{ fontSize: '13px', color: '#64748B' }}>
                  Overall Business Health
                </div>
              </div>

              {/* Sales Trend */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative' as const
              }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '4px',
                  height: '100%',
                  background: getHealthColor(healthData.salesTrend),
                  borderRadius: '12px 0 0 12px'
                }}></div>
                <div style={{ 
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#0F172A',
                  marginBottom: '4px'
                }}>
                  {formatDisplayText(healthData.salesTrend)}
                </div>
                <div style={{ fontSize: '13px', color: '#64748B' }}>
                  Sales Trend
                </div>
              </div>

              {/* Price Competitiveness */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative' as const
              }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '4px',
                  height: '100%',
                  background: getHealthColor(healthData.priceStatus),
                  borderRadius: '12px 0 0 12px'
                }}></div>
                <div style={{ 
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#0F172A',
                  marginBottom: '4px'
                }}>
                  {formatDisplayText(healthData.priceStatus)}
                </div>
                <div style={{ fontSize: '13px', color: '#64748B' }}>
                  Price Position
                </div>
              </div>

              {/* Offer Freshness */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative' as const
              }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '4px',
                  height: '100%',
                  background: getHealthColor(healthData.offerFreshness),
                  borderRadius: '12px 0 0 12px'
                }}></div>
                <div style={{ 
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#0F172A',
                  marginBottom: '4px'
                }}>
                  {formatDisplayText(healthData.offerFreshness)}
                </div>
                <div style={{ fontSize: '13px', color: '#64748B' }}>
                  Offer Status
                </div>
              </div>
            </div>
          </div>

          {/* Daily Business Insights */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <h2 style={{ 
              marginBottom: '24px',
              color: '#0F172A',
              fontSize: '24px',
              fontWeight: 600,
              lineHeight: '1.3'
            }}>
              Business Insights
            </h2>

            {businessTrends && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '20px',
                marginBottom: '24px'
              }}>
                {/* Time-based Tips */}
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '16px 18px'
                }}>
                  <div style={{ 
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0F172A',
                    marginBottom: '6px'
                  }}>
                    Current Time Focus
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6' }}>
                    {businessTrends.timeOfDay?.tip?.replace(/🌅|☀️|🌆|🌙/g, '').trim()}
                  </div>
                </div>

                {/* Day Type Focus */}
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '16px 18px'
                }}>
                  <div style={{ 
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0F172A',
                    marginBottom: '6px'
                  }}>
                    {businessTrends.dayType?.current} Strategy
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginBottom: '8px' }}>
                    {businessTrends.dayType?.trend?.replace(/📈|📊/g, '').trim()}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6' }}>
                    Focus: {businessTrends.dayType?.focus}
                  </div>
                </div>

                {/* Seasonal Tips */}
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '16px 18px'
                }}>
                  <div style={{ 
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0F172A',
                    marginBottom: '6px'
                  }}>
                    Seasonal Recommendations
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#64748B' }}>
                    {businessTrends.seasonalFocus?.tips?.map((tip: string, idx: number) => (
                      <div key={idx} style={{ marginBottom: '4px' }}>
                        {tip.replace(/🥤|🍦|🧊|☕|🧣|🔥|☔|🌧️|🏠|🌸|🎉|🛒/g, '').trim()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Today's Special and Quick Wins */}
            {businessTrends && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '24px'
              }}>
                <div style={{
                  backgroundColor: '#EFF6FF',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #DBEAFE',
                  borderLeft: '4px solid #2563EB'
                }}>
                  <h4 style={{ 
                    marginBottom: '12px', 
                    fontSize: '16px', 
                    color: '#0F172A',
                    fontWeight: 600
                  }}>
                    Today's Strategy
                  </h4>
                  <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0, color: '#64748B' }}>
                    {businessTrends.todaySpecial?.replace(/💪|🎯|🐪|🚀|🎉|👪|😌|📅/g, '').trim()}
                  </p>
                </div>

                <div style={{
                  backgroundColor: '#F0FDF4',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #DCFCE7',
                  borderLeft: '4px solid #16A34A'
                }}>
                  <h4 style={{ 
                    marginBottom: '12px', 
                    fontSize: '16px', 
                    color: '#0F172A',
                    fontWeight: 600
                  }}>
                    Quick Actions (5 min)
                  </h4>
                  <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#64748B' }}>
                    {businessTrends.quickWins?.map((win: string, idx: number) => (
                      <div key={idx} style={{ marginBottom: '4px' }}>
                        {win.replace(/💡|🏷️|📱|🧹|📝/g, '').trim()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI Daily Advice */}
            {dailyAdvice && dailyAdvice.length > 0 && (
              <div style={{
                backgroundColor: '#EFF6FF',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #DBEAFE',
                borderLeft: '4px solid #2563EB',
                marginBottom: '24px'
              }}>
                <h4 style={{ 
                  marginBottom: '12px', 
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#0F172A'
                }}>
                  AI-Generated Recommendations
                </h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6', margin: 0, color: '#64748B' }}>
                  {dailyAdvice.map((advice, index) => (
                    <div key={index} style={{ marginBottom: '8px' }}>
                      {advice}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Insights */}
            {todayInsights && (
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h4 style={{ 
                  marginBottom: '12px', 
                  color: '#0F172A',
                  fontSize: '16px',
                  fontWeight: 600
                }}>
                  System Analysis
                </h4>
                <div style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6' }}>
                  {JSON.stringify(todayInsights)}
                </div>
              </div>
            )}
          </div>

          {/* Quick Business Actions */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <h2 style={{ 
              marginBottom: '24px',
              color: '#0F172A',
              fontSize: '24px',
              fontWeight: 600,
              lineHeight: '1.3'
            }}>Quick Actions</h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px'
            }}>
              <button 
                onClick={() => handleQuickAction('daily-advice')}
                style={{
                  background: '#EFF6FF',
                  border: '1px solid #2563EB',
                  borderRadius: '10px',
                  padding: '18px',
                  textAlign: 'center' as const,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0F172A',
                  cursor: 'pointer',
                  transition: 'border 0.15s ease, background 0.15s ease',
                  minHeight: '70px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.background = '#DBEAFE';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.background = '#EFF6FF';
                }}
              >
                AI Recommendations
              </button>

              <button 
                onClick={() => handleQuickAction('plan-offers')}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '18px',
                  textAlign: 'center' as const,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0F172A',
                  cursor: 'pointer',
                  transition: 'border 0.15s ease, background 0.15s ease',
                  minHeight: '70px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.background = '#F1F5F9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                Plan Campaigns
              </button>

              <button 
                onClick={() => handleQuickAction('customer-replies')}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '18px',
                  textAlign: 'center' as const,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0F172A',
                  cursor: 'pointer',
                  transition: 'border 0.15s ease, background 0.15s ease',
                  minHeight: '70px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.background = '#F1F5F9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                Customer Communication
              </button>

              <button 
                onClick={() => handleQuickAction('inventory')}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '18px',
                  textAlign: 'center' as const,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0F172A',
                  cursor: 'pointer',
                  transition: 'border 0.15s ease, background 0.15s ease',
                  minHeight: '70px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.background = '#F1F5F9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                Inventory Management
              </button>

              <button 
                onClick={() => handleQuickAction('brand-settings')}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '18px',
                  textAlign: 'center' as const,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0F172A',
                  cursor: 'pointer',
                  transition: 'border 0.15s ease, background 0.15s ease',
                  minHeight: '70px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.background = '#F1F5F9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                Business Settings
              </button>

              <button 
                onClick={() => handleQuickAction('vendor-assistant')}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '18px',
                  textAlign: 'center' as const,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0F172A',
                  cursor: 'pointer',
                  transition: 'border 0.15s ease, background 0.15s ease',
                  minHeight: '70px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.background = '#F1F5F9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                Voice Assistant
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .container {
            padding-left: 16px !important;
            padding-right: 16px !important;
            padding-top: 24px !important;
          }
          
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          
          /* Mobile responsive adjustments */
          h1[style*="fontSize: '34px'"] {
            font-size: 28px !important;
          }
          
          h2[style*="fontSize: '24px'"] {
            font-size: 20px !important;
          }
          
          button[style*="minHeight: '70px'"] {
            min-height: 60px !important;
            font-size: 13px !important;
            padding: 14px !important;
          }
        }
        
        @media (max-width: 480px) {
          div[style*="padding: '32px'"] {
            padding: 20px !important;
          }
          
          div[style*="padding: '20px'"] {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BusinessHome;