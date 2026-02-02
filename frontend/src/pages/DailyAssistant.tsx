import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dailyAssistantService, GeminiAdviceResponse, MarketTrendsResponse } from '../services/dailyAssistantService';

interface DailyAdvice {
  category: string;
  title: string;
  advice: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

interface GeminiAdvice {
  mainAdvice: {
    title: string;
    content: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    actionSteps: string[];
    expectedBenefit: string;
  };
  quickTips: Array<{
    title: string;
    content: string;
    icon: string;
    timeToImplement: string;
  }>;
  contextualInsight: {
    title: string;
    content: string;
    urgency: 'immediate' | 'today' | 'this_week';
  };
}

const DailyAssistant: React.FC = () => {
  const { user } = useAuth();
  const [currentAdvice, setCurrentAdvice] = useState<DailyAdvice[]>([]);
  const [geminiAdvice, setGeminiAdvice] = useState<GeminiAdvice | null>(null);
  const [marketTrends, setMarketTrends] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [useAI, setUseAI] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const categories = [
    { id: 'all', name: 'All Advice', icon: '📋' },
    { id: 'stock', name: 'Stock Placement', icon: '📦' },
    { id: 'visibility', name: 'Visibility Tips', icon: '👁️' },
    { id: 'psychology', name: 'Selling Psychology', icon: '🧠' },
    { id: 'timing', name: 'Timing Tips', icon: '⏰' }
  ];

  // Fetch Gemini-powered advice
  const fetchGeminiAdvice = async (category = 'all') => {
    try {
      setLoading(true);
      const response = await dailyAssistantService.getGeminiAdvice(category);
      
      if (response.success && response.data.success) {
        setGeminiAdvice(response.data.advice);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch Gemini advice:', response.data.error);
        // Fallback to static advice
        setUseAI(false);
        setCurrentAdvice(generateDailyAdvice());
      }
    } catch (error) {
      console.error('Error fetching Gemini advice:', error);
      setUseAI(false);
      setCurrentAdvice(generateDailyAdvice());
    } finally {
      setLoading(false);
    }
  };

  // Fetch market trends
  const fetchMarketTrends = async () => {
    try {
      const response = await dailyAssistantService.getMarketTrends();
      
      if (response.success && response.data.success) {
        setMarketTrends(response.data.trends);
      }
    } catch (error) {
      console.error('Error fetching market trends:', error);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setRefreshing(true);
    try {
      if (useAI) {
        await Promise.all([
          fetchGeminiAdvice(selectedCategory),
          fetchMarketTrends()
        ]);
      } else {
        setCurrentAdvice(generateDailyAdvice());
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Toggle between AI and static advice
  const toggleAdviceMode = async () => {
    const newUseAI = !useAI;
    setUseAI(newUseAI);
    
    if (newUseAI) {
      await fetchGeminiAdvice(selectedCategory);
      await fetchMarketTrends();
    } else {
      setCurrentAdvice(generateDailyAdvice());
    }
  };

  const generateDailyAdvice = (): DailyAdvice[] => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const hour = today.getHours();

    const advicePool: DailyAdvice[] = [
      {
        category: 'stock',
        title: 'Morning Stock Arrangement',
        advice: 'Place high-demand items like tea, biscuits, and milk at eye level. Keep impulse items near the counter.',
        icon: '📦',
        priority: 'high'
      },
      {
        category: 'visibility',
        title: 'Shop Front Visibility',
        advice: 'Clean your shop front and arrange colorful items in the window. First impression matters for new customers.',
        icon: '👁️',
        priority: 'high'
      },
      {
        category: 'psychology',
        title: 'Customer Greeting',
        advice: 'Greet customers with a smile and ask "What do you need today?" instead of just waiting silently.',
        icon: '🧠',
        priority: 'medium'
      },
      {
        category: 'timing',
        title: isWeekend ? 'Weekend Rush Preparation' : 'Weekday Strategy',
        advice: isWeekend 
          ? 'Weekends bring families. Stock up on snacks, cold drinks, and household items.'
          : 'Weekdays are for essentials. Focus on daily needs like milk, bread, and vegetables.',
        icon: '⏰',
        priority: 'high'
      },
      {
        category: 'stock',
        title: 'Seasonal Placement',
        advice: 'Move seasonal items to prominent positions. In summer, highlight cold drinks and ice cream.',
        icon: '📦',
        priority: 'medium'
      },
      {
        category: 'psychology',
        title: 'Bundle Suggestions',
        advice: 'When someone buys tea, suggest sugar or biscuits. Natural combinations increase sales.',
        icon: '🧠',
        priority: 'medium'
      },
      {
        category: 'visibility',
        title: 'Price Display',
        advice: 'Write prices clearly in large numbers. Customers should see prices without asking.',
        icon: '👁️',
        priority: 'high'
      },
      {
        category: 'timing',
        title: hour < 12 ? 'Morning Rush Tips' : hour < 17 ? 'Afternoon Strategy' : 'Evening Preparation',
        advice: hour < 12 
          ? 'Morning customers want quick service. Keep breakfast items and newspapers ready.'
          : hour < 17 
          ? 'Afternoon is slow time. Use it to organize stock and clean displays.'
          : 'Evening brings working people. Stock ready-to-eat items and cold drinks.',
        icon: '⏰',
        priority: 'high'
      }
    ];

    return advicePool.sort(() => Math.random() - 0.5).slice(0, 5);
  };

  useEffect(() => {
    const initializeData = async () => {
      if (useAI) {
        await fetchGeminiAdvice(selectedCategory);
        await fetchMarketTrends();
      } else {
        setCurrentAdvice(generateDailyAdvice());
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Update advice when category changes
  useEffect(() => {
    if (useAI && !loading) {
      fetchGeminiAdvice(selectedCategory);
    } else if (!useAI) {
      setCurrentAdvice(generateDailyAdvice());
    }
  }, [selectedCategory, useAI]);

  const filteredAdvice = selectedCategory === 'all' 
    ? currentAdvice 
    : currentAdvice.filter(advice => advice.category === selectedCategory);

  const playAdvice = (advice: DailyAdvice | any) => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      const textToSpeak = advice.content || advice.advice || `${advice.title}. ${advice.advice || ''}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-IN';
      utterance.rate = 0.8;
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  };

  const playAllAdvice = () => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      let allAdviceText = '';

      if (useAI && geminiAdvice) {
        allAdviceText = `Main advice: ${geminiAdvice.mainAdvice.title}. ${geminiAdvice.mainAdvice.content}. `;
        allAdviceText += geminiAdvice.quickTips.map(tip => `${tip.title}. ${tip.content}`).join('. ');
        allAdviceText += `. ${geminiAdvice.contextualInsight.title}. ${geminiAdvice.contextualInsight.content}`;
      } else {
        allAdviceText = filteredAdvice
          .map(advice => `${advice.title}. ${advice.advice}`)
          .join('. Next tip. ');
      }
      
      const utterance = new SpeechSynthesisUtterance(`Here are your daily business tips. ${allAdviceText}`);
      utterance.lang = 'en-IN';
      utterance.rate = 0.8;
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xxl)', paddingBottom: 'var(--spacing-xxl)' }}>
      <div className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div>
            <h1 style={{ marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              Daily Business Assistant
              {useAI && <span style={{ fontSize: '14px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '4px 8px', borderRadius: '12px' }}>🤖 AI-Powered</span>}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {useAI ? 'Real-time AI-powered advice from Gemini' : 'Smart advice to grow your business'}, {user?.name}
            </p>
            {lastUpdated && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
            <button 
              onClick={toggleAdviceMode}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
            >
              {useAI ? '🤖 AI Mode' : '📋 Static Mode'}
            </button>
            
            <button 
              onClick={refreshData}
              disabled={refreshing || loading}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
            >
              {refreshing ? '🔄' : '🔄'} {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <button 
              onClick={playAllAdvice}
              disabled={isPlaying || loading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}
            >
              {isPlaying ? '🔊' : '🎵'} {isPlaying ? 'Playing...' : 'Play All Tips'}
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="card slide-up" style={{ marginBottom: 'var(--spacing-xxl)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Advice Categories</h3>
          
          <div style={{ 
            display: 'flex', 
            gap: 'var(--spacing-sm)', 
            flexWrap: 'wrap' 
          }}>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-xs)',
                  fontSize: '14px'
                }}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Advice Cards */}
        {loading && (
          <div className="card slide-up" style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>🤖</div>
            <h3>Generating AI-Powered Advice...</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Please wait while we analyze your business data and generate personalized recommendations.
            </p>
          </div>
        )}

        {/* Gemini AI Advice Section */}
        {useAI && geminiAdvice && !loading && (
          <div style={{ marginBottom: 'var(--spacing-xxl)' }}>
            {/* Main Advice */}
            <div className="card slide-up" style={{ 
              border: '2px solid #667eea',
              background: 'linear-gradient(135deg, #667eea10, #764ba210)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-lg)' }}>
                <div style={{ fontSize: '48px', minWidth: '60px', textAlign: 'center' }}>
                  🎯
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <h3 style={{ margin: 0 }}>{geminiAdvice.mainAdvice.title}</h3>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: getPriorityColor(geminiAdvice.mainAdvice.priority)
                    }}>
                      {geminiAdvice.mainAdvice.priority.toUpperCase()}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: '#667eea'
                    }}>
                      AI GENERATED
                    </span>
                  </div>
                  
                  <p style={{ 
                    color: 'var(--color-text-secondary)', 
                    lineHeight: '1.6',
                    marginBottom: 'var(--spacing-md)'
                  }}>
                    {geminiAdvice.mainAdvice.content}
                  </p>

                  {geminiAdvice.mainAdvice.actionSteps.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <h4 style={{ fontSize: '14px', marginBottom: 'var(--spacing-xs)' }}>Action Steps:</h4>
                      <ul style={{ marginLeft: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                        {geminiAdvice.mainAdvice.actionSteps.map((step, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                    <button 
                      onClick={() => playAdvice({
                        title: geminiAdvice.mainAdvice.title,
                        content: geminiAdvice.mainAdvice.content
                      })}
                      disabled={isPlaying}
                      className="btn btn-secondary"
                      style={{ 
                        fontSize: '14px',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-xs)'
                      }}
                    >
                      🔊 Listen to this advice
                    </button>
                    
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Expected: {geminiAdvice.mainAdvice.expectedBenefit}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              {geminiAdvice.quickTips.map((tip, index) => (
                <div key={index} className="card slide-up" style={{
                  border: '1px solid #4facfe40',
                  borderLeft: '4px solid #4facfe'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                    <div style={{ fontSize: '32px', minWidth: '40px', textAlign: 'center' }}>
                      {tip.icon}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                        <h4 style={{ margin: 0, fontSize: '16px' }}>{tip.title}</h4>
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: '#4facfe',
                          backgroundColor: '#4facfe20'
                        }}>
                          {tip.timeToImplement}
                        </span>
                      </div>
                      
                      <p style={{ 
                        color: 'var(--color-text-secondary)', 
                        fontSize: '14px',
                        lineHeight: '1.5',
                        marginBottom: 'var(--spacing-sm)'
                      }}>
                        {tip.content}
                      </p>
                      
                      <button 
                        onClick={() => playAdvice(tip)}
                        disabled={isPlaying}
                        className="btn btn-secondary"
                        style={{ 
                          fontSize: '12px',
                          padding: '6px 12px'
                        }}
                      >
                        🔊 Listen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contextual Insight */}
            <div className="card slide-up" style={{
              background: geminiAdvice.contextualInsight.urgency === 'immediate' 
                ? 'linear-gradient(135deg, #ff6b6b10, #ee5a5210)' 
                : 'linear-gradient(135deg, #4ecdc410, #45b7d110)',
              border: `2px solid ${geminiAdvice.contextualInsight.urgency === 'immediate' ? '#ff6b6b' : '#4ecdc4'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-lg)' }}>
                <div style={{ fontSize: '48px', minWidth: '60px', textAlign: 'center' }}>
                  {geminiAdvice.contextualInsight.urgency === 'immediate' ? '⚡' : '💡'}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <h3 style={{ margin: 0 }}>{geminiAdvice.contextualInsight.title}</h3>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: geminiAdvice.contextualInsight.urgency === 'immediate' ? '#ff6b6b' : '#4ecdc4'
                    }}>
                      {geminiAdvice.contextualInsight.urgency.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <p style={{ 
                    color: 'var(--color-text-secondary)', 
                    lineHeight: '1.6',
                    marginBottom: 'var(--spacing-md)'
                  }}>
                    {geminiAdvice.contextualInsight.content}
                  </p>
                  
                  <button 
                    onClick={() => playAdvice(geminiAdvice.contextualInsight)}
                    disabled={isPlaying}
                    className="btn btn-secondary"
                    style={{ 
                      fontSize: '14px',
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)'
                    }}
                  >
                    🔊 Listen to insight
                  </button>
                </div>
              </div>
            </div>

            {/* Market Trends Section */}
            {marketTrends && (
              <div style={{ marginTop: 'var(--spacing-xl)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text)' }}>
                  📈 Market Insights
                </h3>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 'var(--spacing-md)'
                }}>
                  {/* Market Trends */}
                  <div className="card slide-up" style={{ border: '1px solid #f093fb40', borderLeft: '4px solid #f093fb' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>{marketTrends.marketTrends.title}</h4>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                      {marketTrends.marketTrends.content}
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      <strong>Impact:</strong> {marketTrends.marketTrends.impact}
                    </p>
                  </div>

                  {/* Seasonal Demand */}
                  <div className="card slide-up" style={{ border: '1px solid #4facfe40', borderLeft: '4px solid #4facfe' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>{marketTrends.seasonalDemand.title}</h4>
                    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                      <strong>Focus Products:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {marketTrends.seasonalDemand.products.map((product: string, idx: number) => (
                          <span key={idx} style={{
                            padding: '2px 8px',
                            backgroundColor: '#4facfe20',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: '#4facfe'
                          }}>
                            {product}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      {marketTrends.seasonalDemand.strategy}
                    </p>
                  </div>

                  {/* Competitive Edge */}
                  <div className="card slide-up" style={{ border: '1px solid #a8edea40', borderLeft: '4px solid #a8edea' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>{marketTrends.competitiveEdge.title}</h4>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                      {marketTrends.competitiveEdge.content}
                    </p>
                    <div>
                      <strong>Action Items:</strong>
                      <ul style={{ marginLeft: 'var(--spacing-md)', marginTop: '4px' }}>
                        {marketTrends.competitiveEdge.actionItems.map((item: string, idx: number) => (
                          <li key={idx} style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Traditional Advice Cards (when AI is disabled or as fallback) */}
        {/* Traditional Advice Cards (when AI is disabled or as fallback) */}
        {(!useAI || (!geminiAdvice && !loading)) && (
          <div style={{ 
            display: 'grid', 
            gap: 'var(--spacing-lg)' 
          }}>
            {filteredAdvice.map((advice, index) => (
              <div key={index} className="card slide-up" style={{ 
                border: `2px solid ${getPriorityColor(advice.priority)}20`,
                borderLeft: `4px solid ${getPriorityColor(advice.priority)}`
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-lg)' }}>
                  <div style={{ 
                    fontSize: '48px',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {advice.icon}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                      <h3 style={{ margin: 0 }}>{advice.title}</h3>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: getPriorityColor(advice.priority)
                      }}>
                        {advice.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <p style={{ 
                      color: 'var(--color-text-secondary)', 
                      lineHeight: '1.6',
                      marginBottom: 'var(--spacing-md)'
                    }}>
                      {advice.advice}
                    </p>
                    
                    <button 
                      onClick={() => playAdvice(advice)}
                      disabled={isPlaying}
                      className="btn btn-secondary"
                      style={{ 
                        fontSize: '14px',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-xs)'
                      }}
                    >
                      🔊 Listen to this tip
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {(!useAI ? filteredAdvice.length === 0 : (!geminiAdvice && !loading)) && (
          <div className="card slide-up" style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>
              {useAI ? '🤖' : '📋'}
            </div>
            <h3>{useAI ? 'AI service temporarily unavailable' : 'No advice available for this category'}</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {useAI 
                ? 'Please try refreshing or switch to static mode for basic advice.'
                : 'Try selecting a different category or check back tomorrow for fresh tips.'
              }
            </p>
            {useAI && (
              <button 
                onClick={toggleAdviceMode}
                className="btn btn-secondary"
                style={{ marginTop: 'var(--spacing-md)' }}
              >
                Switch to Static Mode
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyAssistant;