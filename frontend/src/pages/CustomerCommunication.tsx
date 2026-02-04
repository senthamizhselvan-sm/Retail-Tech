import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import communicationService from '../services/communicationService';
import VoiceInput from '../components/VoiceInput';

interface ConversationHistory {
  query: string;
  reply: string;
  category: string;
  language: string;
  timestamp: Date;
  smartMode?: boolean;
}

interface InventorySummary {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
}

const CustomerCommunication: React.FC = () => {
  const { user } = useAuth();

  // Smart Mode State
  const [smartMode, setSmartMode] = useState(true); // Default ON
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [shopTimings, setShopTimings] = useState<string>('9:00 AM - 10:00 PM');

  // Existing States
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'tamil' | 'hindi'>('english');
  const [customContext, setCustomContext] = useState<string>('');
  const [generatedReply, setGeneratedReply] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [voiceLanguage, setVoiceLanguage] = useState<'en-IN' | 'ta-IN'>('en-IN');

  const categories = [
    { id: 'general', name: 'General', icon: '💬', color: '#6366f1' },
    { id: 'price', name: 'Price', icon: '💰', color: '#f59e0b' },
    { id: 'availability', name: 'Stock', icon: '📦', color: '#10b981' },
    { id: 'delivery', name: 'Delivery', icon: '🚚', color: '#3b82f6' },
    { id: 'discount', name: 'Discount', icon: '🏷️', color: '#ec4899' },
    { id: 'quality', name: 'Quality', icon: '⭐', color: '#8b5cf6' },
    { id: 'complaint', name: 'Complaint', icon: '⚠️', color: '#ef4444' },
    { id: 'bulk', name: 'Bulk Order', icon: '📊', color: '#14b8a6' }
  ];

  // Load data on mount
  useEffect(() => {
    loadConversationHistory();
    if (smartMode) {
      loadInventorySummary();
    }
  }, [smartMode]);

  const loadInventorySummary = async () => {
    try {
      const response = await communicationService.getInventorySummary();
      if (response.success) {
        setInventorySummary(response.summary);
      }
    } catch (err) {
      console.error('Failed to load inventory summary:', err);
    }
  };

  const loadConversationHistory = async () => {
    try {
      const response = await communicationService.getConversationHistory(10);
      if (response.success) {
        setConversationHistory(response.history);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const generateAIReply = async () => {
    if (!customContext.trim()) {
      setError('Please enter customer query');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedReply('');

    try {
      const customerInfo = customerName ? { name: customerName } : undefined;

      const response = await communicationService.generateAIReply(
        customContext,
        selectedCategory,
        selectedLanguage,
        customerInfo,
        smartMode // Pass smart mode flag
      );

      if (response.success) {
        setGeneratedReply(response.reply);

        // Show different success message based on mode
        if (smartMode) {
          setSuccess(`✅ SMART Reply generated with ${response.metadata?.inventoryItemsUsed || 0} inventory items!`);
        } else {
          setSuccess('✅ Reply generated successfully!');
        }

        await loadConversationHistory();
        setTimeout(() => setSuccess(null), 3000);
      }

    } catch (err: any) {
      console.error('AI generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate reply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceQuery = async (transcript: string, append?: boolean, lang?: 'en-IN' | 'ta-IN') => {
    setCustomContext(transcript);

    try {
      const response = await communicationService.processVoiceQuery(
        transcript,
        lang === 'ta-IN' ? 'tamil' : 'english'
      );

      if (response.success && response.category) {
        setSelectedCategory(response.category);
      }
    } catch (err) {
      console.error('Voice processing error:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('📋 Copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const shareToWhatsApp = (text: string) => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const clearForm = () => {
    setCustomContext('');
    setGeneratedReply('');
    setCustomerName('');
    setError(null);
    setSuccess(null);
  };

  const toggleSmartMode = () => {
    setSmartMode(!smartMode);
    if (!smartMode) {
      loadInventorySummary();
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xxl)', paddingBottom: 'var(--spacing-xxl)' }}>
      <div className="fade-in">
        {/* Header with Smart Mode Toggle */}
        <div style={{ marginBottom: 'var(--spacing-xxl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
            <div>
              <h1 style={{ marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>💬</span>
                Customer Communication Assistant
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>
                {smartMode
                  ? '🧠 SMART MODE: AI has access to your real inventory data'
                  : 'Standard AI-powered WhatsApp reply generator'
                }
              </p>
            </div>

            {/* SMART MODE TOGGLE - MAIN FEATURE */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 'var(--spacing-sm)'
            }}>
              <div style={{
                padding: 'var(--spacing-md) var(--spacing-lg)',
                backgroundColor: smartMode ? '#10B981' : '#6B7280',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: smartMode ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                border: '2px solid',
                borderColor: smartMode ? '#059669' : '#4B5563'
              }}
                onClick={toggleSmartMode}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    fontSize: '32px',
                    animation: smartMode ? 'pulse 2s infinite' : 'none'
                  }}>
                    🧠
                  </div>
                  <div>
                    <div style={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      marginBottom: '4px'
                    }}>
                      SMART MODE
                    </div>
                    <div style={{
                      color: 'white',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '20px',
                        backgroundColor: smartMode ? '#34D399' : '#9CA3AF',
                        borderRadius: '10px',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          position: 'absolute',
                          top: '2px',
                          left: smartMode ? '22px' : '2px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                      <span>{smartMode ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory Summary Badge */}
              {smartMode && inventorySummary && (
                <div style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #10B981',
                  borderRadius: 'var(--border-radius)',
                  fontSize: '12px',
                  color: '#065F46'
                }}>
                  📊 {inventorySummary.totalProducts} products loaded
                  {inventorySummary.lowStockCount > 0 && (
                    <span style={{ marginLeft: '8px', color: '#DC2626' }}>
                      • {inventorySummary.lowStockCount} low stock
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Smart Mode Info Banner */}
          {smartMode && (
            <div style={{
              padding: 'var(--spacing-md)',
              backgroundColor: '#DBEAFE',
              border: '2px solid #3B82F6',
              borderRadius: 'var(--border-radius)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              marginTop: 'var(--spacing-md)'
            }}>
              <div style={{ fontSize: '24px' }}>💡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#1E40AF', marginBottom: '4px' }}>
                  Smart Mode Active - AI Can See Your Inventory!
                </div>
                <div style={{ fontSize: '13px', color: '#1E3A8A' }}>
                  Replies will include actual stock levels, real prices, and accurate product information from your inventory.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div style={{
            padding: 'var(--spacing-md)',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: 'var(--border-radius)',
            marginBottom: 'var(--spacing-lg)',
            border: '1px solid #fecaca'
          }}>
            ❌ {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: 'var(--spacing-md)',
            backgroundColor: '#d1fae5',
            color: '#065f46',
            borderRadius: 'var(--border-radius)',
            marginBottom: 'var(--spacing-lg)',
            border: '1px solid #6ee7b7'
          }}>
            {success}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)' }}>
          {/* LEFT PANEL - Input */}
          <div>
            {/* Voice Input */}
            <div className="card slide-up" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎤</span>
                Voice Input
              </h3>
              <VoiceInput
                onTranscript={handleVoiceQuery}
                onLanguageChange={(lang) => setVoiceLanguage(lang)}
              />
            </div>

            {/* Customer Info */}
            <div className="card slide-up" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>👤 Customer Info (Optional)</h3>
              <input
                type="text"
                className="input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name..."
                style={{ width: '100%' }}
              />
            </div>

            {/* Language Selection */}
            <div className="card slide-up" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>🌍 Reply Language</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-sm)' }}>
                {[
                  { id: 'english', name: 'English', flag: '🇬🇧' },
                  { id: 'tamil', name: 'தமிழ்', flag: '🇮🇳' },
                  { id: 'hindi', name: 'हिंदी', flag: '🇮🇳' }
                ].map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLanguage(lang.id as any)}
                    style={{
                      padding: 'var(--spacing-md)',
                      backgroundColor: selectedLanguage === lang.id ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: selectedLanguage === lang.id ? 'white' : 'var(--color-text)',
                      border: selectedLanguage === lang.id ? 'none' : '1px solid var(--color-border)',
                      borderRadius: 'var(--border-radius)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: selectedLanguage === lang.id ? 'bold' : 'normal',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>{lang.flag}</div>
                    <div style={{ marginTop: '4px' }}>{lang.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selection */}
            <div className="card slide-up" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>📋 Query Category</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-sm)' }}>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      padding: 'var(--spacing-md)',
                      backgroundColor: selectedCategory === category.id ? category.color : 'var(--color-surface)',
                      color: selectedCategory === category.id ? 'white' : 'var(--color-text)',
                      border: selectedCategory === category.id ? 'none' : '1px solid var(--color-border)',
                      borderRadius: 'var(--border-radius)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: selectedCategory === category.id ? 'bold' : 'normal',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Context Input */}
            <div className="card slide-up">
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>✍️ Customer Query</h3>
              <textarea
                className="textarea"
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder={smartMode
                  ? "Type customer's question...\nExample: 'Do you have Basmati rice? What's the price?'\n\n💡 Smart Mode will check your actual inventory!"
                  : "Type customer's question...\nExample: 'Do you have rice? What's the price?'"
                }
                rows={5}
                style={{ marginBottom: 'var(--spacing-md)', width: '100%' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                <button
                  onClick={generateAIReply}
                  disabled={loading || !customContext.trim()}
                  style={{
                    padding: 'var(--spacing-md)',
                    backgroundColor: loading ? '#9ca3af' : (smartMode ? '#10B981' : 'var(--color-primary)'),
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius)',
                    cursor: loading || !customContext.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    opacity: loading || !customContext.trim() ? 0.6 : 1,
                    boxShadow: smartMode && !loading ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                  }}
                >
                  {loading
                    ? '⏳ Generating...'
                    : smartMode
                      ? '🧠🤖 Generate SMART Reply'
                      : '🤖 Generate AI Reply'
                  }
                </button>

                <button
                  onClick={clearForm}
                  style={{
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🗑️ Clear
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Output */}
          <div>
            {/* Generated Reply */}
            {generatedReply && (
              <div className="card slide-up" style={{
                marginBottom: 'var(--spacing-lg)',
                border: smartMode ? '3px solid #10B981' : '2px solid #6366F1',
                background: smartMode
                  ? 'linear-gradient(135deg, #d1fae5 0%, #ffffff 100%)'
                  : 'linear-gradient(135deg, #e0e7ff 0%, #ffffff 100%)'
              }}>
                <h3 style={{
                  marginBottom: 'var(--spacing-md)',
                  color: smartMode ? '#10B981' : '#6366F1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>{smartMode ? '🧠' : '🤖'}</span>
                  {smartMode ? 'SMART AI Reply (with Inventory Data)' : 'AI Generated Reply'}
                </h3>

                {/* Smart Mode Badge */}
                {smartMode && (
                  <div style={{
                    padding: 'var(--spacing-sm)',
                    backgroundColor: '#10B981',
                    color: 'white',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginBottom: 'var(--spacing-md)',
                    display: 'inline-block'
                  }}>
                    ✅ Generated using real inventory data
                  </div>
                )}

                <div style={{
                  padding: 'var(--spacing-lg)',
                  backgroundColor: 'white',
                  borderRadius: 'var(--border-radius)',
                  marginBottom: 'var(--spacing-md)',
                  fontSize: '15px',
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap',
                  border: smartMode ? '1px solid #6ee7b7' : '1px solid #c7d2fe'
                }}>
                  {generatedReply}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                  <button
                    onClick={() => copyToClipboard(generatedReply)}
                    style={{
                      padding: 'var(--spacing-md)',
                      backgroundColor: smartMode ? '#10B981' : '#6366F1',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--border-radius)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    📋 Copy to Clipboard
                  </button>

                  <button
                    onClick={() => shareToWhatsApp(generatedReply)}
                    style={{
                      padding: 'var(--spacing-md)',
                      backgroundColor: '#25D366',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--border-radius)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    📱 Share to WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* Smart Mode Features Showcase */}
            {smartMode && !generatedReply && (
              <div className="card slide-up" style={{
                marginBottom: 'var(--spacing-lg)',
                border: '2px solid #10B981',
                background: 'linear-gradient(135deg, #ECFDF5 0%, #ffffff 100%)'
              }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#10B981' }}>
                  🧠 Smart Mode Features
                </h3>
                <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                  {[
                    { icon: '📊', text: 'Real-time stock levels in replies' },
                    { icon: '💰', text: 'Accurate current prices' },
                    { icon: '⚠️', text: 'Low stock alerts' },
                    { icon: '🎯', text: 'Product recommendations' },
                    { icon: '🕐', text: 'Shop timing awareness' },
                    { icon: '📦', text: 'Out-of-stock alternatives' }
                  ].map((feature, idx) => (
                    <div key={idx} style={{
                      padding: 'var(--spacing-sm)',
                      backgroundColor: 'white',
                      borderRadius: 'var(--border-radius)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px'
                    }}>
                      <span style={{ fontSize: '18px' }}>{feature.icon}</span>
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation History */}
            <div className="card slide-up">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-md)'
              }}>
                <h3 style={{ margin: 0 }}>📜 Recent Conversations</h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {showHistory ? '👁️ Hide' : '👁️ Show'}
                </button>
              </div>

              {showHistory && (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {conversationHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
                      No conversation history yet
                    </div>
                  ) : (
                    conversationHistory.map((conv, index) => (
                      <div key={index} style={{
                        padding: 'var(--spacing-md)',
                        marginBottom: 'var(--spacing-sm)',
                        backgroundColor: 'var(--color-background)',
                        borderRadius: 'var(--border-radius)',
                        border: `1px solid ${conv.smartMode ? '#10B981' : 'var(--color-border)'}`
                      }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{new Date(conv.timestamp).toLocaleString()} • {conv.category} • {conv.language}</span>
                          {conv.smartMode && (
                            <span style={{ color: '#10B981', fontWeight: 'bold' }}>🧠 SMART</span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', marginBottom: '8px', color: '#6b7280' }}>
                          <strong>Q:</strong> {conv.query}
                        </div>
                        <div style={{ fontSize: '13px', color: '#059669' }}>
                          <strong>A:</strong> {conv.reply}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="card slide-up" style={{ marginTop: 'var(--spacing-xxl)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
            🔄 Smart Mode vs Standard Mode
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)' }}>
            {/* Standard Mode */}
            <div style={{
              padding: 'var(--spacing-lg)',
              backgroundColor: '#F3F4F6',
              borderRadius: 'var(--border-radius)',
              border: '2px solid #9CA3AF'
            }}>
              <div style={{ fontSize: '24px', marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
                🤖 Standard Mode
              </div>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Customer asks: "Do you have rice?"</div>
                <div style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'white',
                  borderRadius: 'var(--border-radius)',
                  fontStyle: 'italic',
                  fontSize: '14px'
                }}>
                  "Yes, we have rice. Please visit our shop for price and availability."
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                ❌ Generic reply<br />
                ❌ No specific details<br />
                ❌ Customer needs to follow up
              </div>
            </div>

            {/* Smart Mode */}
            <div style={{
              padding: 'var(--spacing-lg)',
              backgroundColor: '#ECFDF5',
              borderRadius: 'var(--border-radius)',
              border: '2px solid #10B981'
            }}>
              <div style={{ fontSize: '24px', marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
                🧠 Smart Mode
              </div>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Customer asks: "Do you have rice?"</div>
                <div style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'white',
                  borderRadius: 'var(--border-radius)',
                  fontStyle: 'italic',
                  fontSize: '14px'
                }}>
                  "Yes! We have Basmati Rice (25kg @ ₹55/kg) and Ponni Rice (15kg @ ₹48/kg). Fresh stock arrived today. Shop open till 10 PM. Want me to reserve some?"
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#065F46' }}>
                ✅ Specific products & quantities<br />
                ✅ Real-time prices<br />
                ✅ Additional helpful info<br />
                ✅ Professional & complete
              </div>
            </div>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="card slide-up" style={{ marginTop: 'var(--spacing-xxl)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>💡 Pro Tips for Smart Mode</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
            <div style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--color-border)'
            }}>
              <h4 style={{ marginBottom: '8px' }}>📦 Keep Inventory Updated</h4>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Smart Mode uses your real inventory. Keep stock levels and prices current for best results.
              </p>
            </div>

            <div style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--color-border)'
            }}>
              <h4 style={{ marginBottom: '8px' }}>🎤 Use Voice Input</h4>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Speak customer queries naturally. AI will understand and generate smart replies instantly.
              </p>
            </div>

            <div style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--color-border)'
            }}>
              <h4 style={{ marginBottom: '8px' }}>📱 Quick Share</h4>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Copy to WhatsApp or share directly. Customers get accurate info instantly.
              </p>
            </div>

            <div style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--color-border)'
            }}>
              <h4 style={{ marginBottom: '8px' }}>🌍 Multi-Language Support</h4>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Generate replies in English, Tamil, or Hindi with real inventory data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animation for pulse effect */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerCommunication;