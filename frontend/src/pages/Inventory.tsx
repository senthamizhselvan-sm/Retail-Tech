import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import inventoryService, {
  InventoryItem,
  LowStockAlert,
  AddProductData,
  InventoryTask,
  ActivityLog,
  EnhancedInventoryResponse
} from '../services/inventoryService';
import VoiceInput from '../components/VoiceInput';
import BasketInterface from '../components/BasketInterface';
import SimpleBasketInterface from '../components/SimpleBasketInterface';
import { BasketAction, BasketHelpers } from '../utils/basketHelpers';
import { SimpleBasketHelpers } from '../utils/simpleBasketHelpers';
import '../styles/basket.css';

const Inventory: React.FC = () => {
  const { } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // NEW: Basket mode state - now with simple option
  const [mode, setMode] = useState<'list' | 'basket' | 'simple-basket'>('list');

  // Enhanced features state
  const [healthScore, setHealthScore] = useState<number>(0);
  const [healthSummary, setHealthSummary] = useState<string>('');
  const [todaysTasks, setTodaysTasks] = useState<InventoryTask[]>([]);
  const [dayHint, setDayHint] = useState<string>('');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [hasUndoAction, setHasUndoAction] = useState<boolean>(false);
  const [showUndoButton, setShowUndoButton] = useState<boolean>(false);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState<AddProductData>({
    productName: '',
    category: '',
    quantity: 0,
    unit: 'piece',
    minStockLevel: 5,
    expiryDate: '',
    costPrice: undefined,
    sellingPrice: undefined,
    mrp: undefined
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [voiceCommand, setVoiceCommand] = useState<string>('');
  const [voiceLanguage, setVoiceLanguage] = useState<'en-IN' | 'ta-IN'>('en-IN');

  // Tamil number words mapping to digits
  const tamilNumbers: Record<string, number> = {
    'ஒன்று': 1, 'இரண்டு': 2, 'மூன்று': 3, 'நான்கு': 4, 'ஐந்து': 5,
    'ஆறு': 6, 'ஏழு': 7, 'எட்டு': 8, 'ஒன்பது': 9, 'பத்து': 10,
    'பதினொன்று': 11, 'பன்னிரண்டு': 12, 'பதிமூன்று': 13, 'பதினான்கு': 14, 'பதினைந்து': 15,
    'பதினாறு': 16, 'பதினேழு': 17, 'பதினெட்டு': 18, 'பத்தொன்பது': 19, 'இருபது': 20,
    'முப்பது': 30, 'நாற்பது': 40, 'ஐம்பது': 50, 'அறுபது': 60, 'எழுபது': 70,
    'எண்பது': 80, 'தொண்ணூறு': 90, 'நூறு': 100
  };

  // Tamil unit mapping
  const tamilUnits: Record<string, string> = {
    'கிலோ': 'kg', 'கிலோகிராம்': 'kg', 'பாக்கெட்': 'packet', 'துண்டு': 'piece', 'லிட்டர்': 'liter'
  };

  // Tamil -> English product mapping for common names
  const tamilToEnglishProducts: Record<string, string> = {
    'அரிசி': 'rice',
    'சோப்': 'soap',
    'சோப்பு': 'soap',
    'பால்': 'milk',
    'சர்க்கரை': 'sugar',
    'உப்பு': 'salt',
    'எண்ணெய்': 'oil',
    'மசாலா': 'masala',
    'பேட்டரி': 'battery',
    'பிஸ்கட்': 'biscuit',
    'பால் பொருட்கள்': 'dairy',
    'டெய்ரி மில்க்': 'diary milk'
  };

  // Extract a Tamil number word or a digit from text
  const extractTamilNumber = (text: string): number | null => {
    if (!text) return null;
    // look for known tamil words
    for (const [word, num] of Object.entries(tamilNumbers)) {
      if (text.includes(word)) return num;
    }

    // digits
    const digitMatch = text.match(/\d+/);
    if (digitMatch) return parseInt(digitMatch[0], 10);

    return null;
  };

  // Translate Tamil product name to English if mapped, or try simple token mapping
  const translateTamilToEnglish = (name: string): string => {
    if (!name) return '';
    const trimmed = name.trim();
    if (tamilToEnglishProducts[trimmed]) return tamilToEnglishProducts[trimmed];

    // Try token-wise mapping
    const tokens = trimmed.split(/\s+/);
    const mappedTokens = tokens.map(t => tamilToEnglishProducts[t] || t);
    const candidate = mappedTokens.join(' ');
    return candidate;
  };

  // Simple Levenshtein distance for fuzzy matching
  const levenshtein = (a: string, b: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };
  // Load data on component mount
  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const [inventoryResponse, alertsData, insightsData] = await Promise.all([
        inventoryService.getInventory(),
        inventoryService.getLowStockAlerts(),
        inventoryService.getInventoryInsights()
      ]);

      // Handle enhanced inventory response
      setInventory(inventoryResponse.data);
      setHealthScore(inventoryResponse.healthScore);
      setHealthSummary(inventoryResponse.healthSummary);
      setTodaysTasks(inventoryResponse.todaysTasks);
      setDayHint(inventoryResponse.dayHint);
      setActivityLogs(inventoryResponse.activityLogs || []);
      setHasUndoAction(inventoryResponse.hasUndoAction || false);

      setAlerts(alertsData);
      setInsights(insightsData);
      setError(null);
    } catch (err) {
      console.error('Error loading inventory data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  // Voice command handlers
  const handleInventoryVoice = (transcript: string, append?: boolean, lang?: 'en-IN' | 'ta-IN') => {
    setVoiceCommand(transcript);
    if (lang) {
      setVoiceLanguage(lang);
    }
    parseInventoryCommand(transcript);
  };

  // COMPLETE VOICE SYSTEM IMPLEMENTATION

  // Add these constants at the top of the component (or here locally if preferred, but top is cleaner. I will put them here for now to ensure they exist)
  const TAMIL_PRODUCT_MAP: Record<string, string> = {
    'சோப்': 'soap', 'சோப': 'soap', 'சோப்பு': 'soap',
    'அரிசி': 'rice', 'அரிச்சி': 'rice',
    'பால்': 'milk', 'பாலு': 'milk',
    'மசாலா': 'masala', 'மசால': 'masala',
    'பேட்டரி': 'battery', 'பட்டரி': 'battery',
    'டெய்ரி': 'diary', 'டைரி': 'diary',
    'மில்க்': 'milk',
    'சர்க்கரை': 'sugar',
    'உப்பு': 'salt',
    'எண்ணெய்': 'oil'
  };

  // Voice command parsing function
  // Voice command parsing - now just passes to backend
  const parseInventoryCommand = async (text: string) => {
    const cleanText = text.trim();
    console.log('🎤 Voice command received:', cleanText);

    // Check for basket mode switching commands
    if (cleanText.toLowerCase().includes('switch to basket') || cleanText.toLowerCase().includes('பழங்கூடை')) {
      setMode('basket');
      setSuccess('Switched to basket mode');
      return;
    }
    
    if (cleanText.toLowerCase().includes('switch to simple') || cleanText.toLowerCase().includes('எளிய கூடை')) {
      setMode('simple-basket');
      setSuccess('Switched to simple basket mode');
      return;
    }
    
    if (cleanText.toLowerCase().includes('switch to list') || cleanText.toLowerCase().includes('பட்டியல்')) {
      setMode('list');
      setSuccess('Switched to list mode');
      return;
    }

    // Auto-detect Tamil characters (for UI display only)
    const hasTamil = /[\u0B80-\u0BFF]/.test(cleanText);
    console.log(`🌐 UI detected: ${hasTamil ? 'Tamil' : 'English'} (backend will auto-detect)`);

    // Send directly to backend - it will handle language detection and correction
    await sendCommandToGemini(cleanText, hasTamil);
  };

  // Send command to backend/Gemini with auto-correction
  const sendCommandToGemini = async (command: string, isTamil: boolean = false) => {
    console.log('📡 Sending voice command to backend...');
    setVoiceCommand(`🎤 Processing: "${command}"`);
    setLoading(true);

    try {
      // No need to specify language - backend auto-detects
      const data = await inventoryService.processVoiceCommand(command);

      console.log('📥 Response from backend:', data);

      if (!data.success) {
        // Command not understood clearly
        setError(data.message || 'Could not understand command');

        if (data.suggestion) {
          setVoiceCommand(`💡 ${data.suggestion}`);
        }

        // Show what was detected
        if (data.parsed) {
          console.log('🔍 Parsed result:', data.parsed);
          if (data.parsed.correction) {
            setVoiceCommand(`🔍 ${data.parsed.correction}`);
          }
        }

        return;
      }

      // SUCCESS! Build comprehensive success message
      let successMsg = data.message;

      // Add correction info if any
      if (data.correction && data.correction !== 'None needed') {
        successMsg += `\n\n🔧 Auto-correction: ${data.correction}`;
      }

      // Add language detection info
      if (data.detectedLanguage) {
        const langEmoji = data.detectedLanguage === 'tamil' ? '🇮🇳' :
          data.detectedLanguage === 'english' ? '🇬🇧' : '🌐';
        successMsg += `\n${langEmoji} Detected: ${data.detectedLanguage}`;
      }

      // Add confidence level
      if (data.confidence) {
        const confEmoji = data.confidence === 'high' ? '✅' :
          data.confidence === 'medium' ? '⚠️' : '❓';
        successMsg += `\n${confEmoji} Confidence: ${data.confidence}`;
      }

      setSuccess(successMsg);
      setVoiceCommand('');

      // Refresh inventory to show updated data
      await loadInventoryData();

      // Update activity logs
      if (data.activityLogs) {
        setActivityLogs(data.activityLogs);
      }

      // Show undo button for 10 seconds
      if (data.hasUndoAction) {
        setShowUndoButton(true);
        if (undoTimer) clearTimeout(undoTimer);
        const timer = setTimeout(() => setShowUndoButton(false), 10000) as any;
        setUndoTimer(timer);
      }

    } catch (error: any) {
      console.error('❌ Voice command error:', error);

      let errorMsg = '🚫 Voice command failed: ';

      if (error.message.includes('timeout')) {
        errorMsg += 'AI processing timeout. Try again.';
      } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        errorMsg += 'Network error. Check your connection.';
      } else if (error.message.includes('404')) {
        errorMsg += 'Server endpoint not found. Check backend is running.';
      } else if (error.message.includes('GEMINI_API_KEY')) {
        errorMsg += 'Gemini API not configured. Contact administrator.';
      } else {
        errorMsg += error.message;
      }

      setError(errorMsg);
      setVoiceCommand('');

      // Show retry hint after 3 seconds
      setTimeout(() => {
        setVoiceCommand(voiceLanguage === 'ta-IN'
          ? '🔄 மீண்டும் முயற்சிக்க மைக்ரோபோனை கிளிக் செய்யவும்'
          : '🔄 Click microphone to try again'
        );
      }, 3000);

    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName.trim()) {
      setError('Product name is required');
      return;
    }

    setLoading(true);
    try {
      await inventoryService.addProduct(formData);
      setSuccess('Product added successfully!');
      setShowAddForm(false);
      setFormData({
        productName: '',
        category: '',
        quantity: 0,
        unit: 'piece',
        minStockLevel: 5,
        expiryDate: '',
        costPrice: undefined,
        sellingPrice: undefined,
        mrp: undefined
      });
      await loadInventoryData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityUpdate = async (productId: string, delta: number) => {
    try {
      const response = await inventoryService.updateQuantity(productId, delta, 'manual');
      await loadInventoryData();

      // Update activity logs and undo state
      setActivityLogs(response.activityLogs || []);
      setHasUndoAction(response.hasUndoAction || false);

      // Show undo button for 10 seconds
      setShowUndoButton(true);
      if (undoTimer) clearTimeout(undoTimer);
      const timer = setTimeout(() => {
        setShowUndoButton(false);
      }, 10000);
      setUndoTimer(timer);

      setSuccess('Quantity updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await inventoryService.deleteProduct(productId);
      await loadInventoryData();
      setSuccess('Product deleted successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  // Handle undo last action
  const handleUndo = async () => {
    try {
      const response = await inventoryService.undoLastAction();
      await loadInventoryData();
      setActivityLogs(response.activityLogs || []);
      setHasUndoAction(response.hasUndoAction || false);
      setShowUndoButton(false);
      if (undoTimer) clearTimeout(undoTimer);
      setSuccess(response.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to undo action');
    }
  };

  // NEW: Handle basket actions
  const handleBasketUpdate = async (action: BasketAction) => {
    try {
      setLoading(true);
      
      // Validate the action
      const validation = BasketHelpers.validateBasketAction(action, inventory);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return;
      }

      // Convert basket action to inventory updates
      const updates = BasketHelpers.basketActionToInventoryUpdates(action);
      
      // Process each update
      for (const update of updates) {
        await inventoryService.updateQuantity(
          update.productId, 
          update.quantityDelta, 
          'basket' as any
        );
      }

      // Refresh inventory data
      await loadInventoryData();
      
      // Show success message
      const successMessage = BasketHelpers.getSuccessMessage(action);
      setSuccess(successMessage);

      // Show undo button for 10 seconds
      setShowUndoButton(true);
      if (undoTimer) clearTimeout(undoTimer);
      const timer = setTimeout(() => setShowUndoButton(false), 10000);
      setUndoTimer(timer);

    } catch (err: any) {
      console.error('Basket update failed:', err);
      setError(err.response?.data?.message || 'Failed to process basket action');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Handle simple basket actions
  const handleSimpleBasketUpdate = async (action: any) => {
    try {
      setLoading(true);
      
      // SIMPLE VALIDATION
      const validation = SimpleBasketHelpers.validateAction(action, inventory);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return;
      }

      // SIMPLE UPDATES
      const updates = SimpleBasketHelpers.convertToUpdates(action);
      
      // Process each update
      for (const update of updates) {
        await inventoryService.updateQuantity(
          update.productId, 
          update.quantityDelta, 
          'basket' as any
        );
      }

      // SIMPLE SUCCESS MESSAGE
      const successMessage = SimpleBasketHelpers.getSuccessMessage(action);
      setSuccess(successMessage);

      // Refresh data
      await loadInventoryData();

      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      // SIMPLE ERROR MESSAGE
      setError('Failed to update. Please try again.');
      console.error('Simple basket error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusStyle = (status: string) => {
    switch (status) {
      case 'SAFE':
        return { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' };
      case 'LOW_STOCK':
        return { backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' };
      case 'OUT_OF_STOCK':
        return { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f1b2b5' };
      default:
        return { backgroundColor: '#e9ecef', color: '#495057', border: '1px solid #ced4da' };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No expiry';
    return new Date(dateString).toLocaleDateString();
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimer) {
        clearTimeout(undoTimer);
      }
    };
  }, [undoTimer]);

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xxl)', paddingBottom: 'var(--spacing-xxl)' }}>
      <div className="fade-in">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <h1>Inventory Management</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <VoiceInput
              onTranscript={handleInventoryVoice}
              onLanguageChange={(lang) => setVoiceLanguage(lang)}
              disabled={loading}
            />

            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{voiceLanguage === 'en-IN' ? '🇬🇧' : '🇮🇳'}</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: 13 }}>{voiceLanguage === 'en-IN' ? 'English' : 'தமிழ்'}</strong>
                <span style={{ fontSize: 11 }}>{voiceLanguage === 'ta-IN' ? 'Tamil voice commands supported' : 'English voice commands'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* NEW: Mode Switcher */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: 'var(--spacing-lg)',
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--color-background-alt)',
          borderRadius: 'var(--border-radius)',
          border: '2px solid var(--color-primary)'
        }}>
          <button
            onClick={() => setMode('list')}
            className={mode === 'list' ? 'active' : ''}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: mode === 'list' ? 'var(--color-primary)' : '#e9ecef',
              color: mode === 'list' ? 'white' : '#495057',
              transform: mode === 'list' ? 'scale(1.02)' : 'scale(1)',
              boxShadow: mode === 'list' ? '0 4px 8px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            📋 List View
          </button>
          <button
            onClick={() => setMode('simple-basket')}
            className={mode === 'simple-basket' ? 'active' : ''}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: mode === 'simple-basket' ? '#4CAF50' : '#e9ecef',
              color: mode === 'simple-basket' ? 'white' : '#495057',
              transform: mode === 'simple-basket' ? 'scale(1.02)' : 'scale(1)',
              boxShadow: mode === 'simple-basket' ? '0 4px 8px rgba(76, 175, 80, 0.3)' : 'none'
            }}
          >
            🧺 Simple Basket (NEW!)
          </button>
          <button
            onClick={() => setMode('basket')}
            className={mode === 'basket' ? 'active' : ''}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: mode === 'basket' ? '#2196F3' : '#e9ecef',
              color: mode === 'basket' ? 'white' : '#495057',
              transform: mode === 'basket' ? 'scale(1.02)' : 'scale(1)',
              boxShadow: mode === 'basket' ? '0 4px 8px rgba(33, 150, 243, 0.3)' : 'none'
            }}
          >
            🎯 Advanced Basket
          </button>
        </div>

        {/* Voice Command Display */}
        {voiceCommand && (
          <div style={{
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--border-radius)',
            marginBottom: 'var(--spacing-lg)',
            border: '1px solid #bbdefb'
          }}>
            <strong>Voice Command:</strong> "{voiceCommand}"
          </div>
        )}

        {/* CONDITIONAL RENDERING: Simple Basket vs Advanced Basket vs List Mode */}
        {mode === 'simple-basket' ? (
          <SimpleBasketInterface
            inventory={inventory}
            onUpdate={handleSimpleBasketUpdate}
            loading={loading}
          />
        ) : mode === 'basket' ? (
          <BasketInterface
            inventory={inventory}
            onUpdate={handleBasketUpdate}
            onVoiceCommand={parseInventoryCommand}
            loading={loading}
          />
        ) : (
          <>
            {/* EXISTING LIST VIEW CONTENT */}

        {/* Voice Command Help Panel */}
        <div style={{
          backgroundColor: '#e7f3ff',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--border-radius)',
          border: '2px solid #2196F3',
          marginBottom: 'var(--spacing-md)'
        }}>
          <h3 style={{ margin: '0 0 var(--spacing-sm) 0', color: '#1976D2', fontSize: '16px' }}>
            🎤 How to Add New Products by Voice
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            {/* English Examples */}
            <div style={{ backgroundColor: 'white', padding: 'var(--spacing-sm)', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1976D2', fontSize: '14px' }}>
                🇬🇧 English Examples
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
                <li><strong>"new product butter 10"</strong></li>
                <li><strong>"create chocolate 20"</strong></li>
                <li><strong>"add new sugar 15"</strong></li>
                <li><strong>"start selling tea 30"</strong></li>
              </ul>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                💡 Use keywords: "new product", "create", "add new"
              </div>
            </div>

            {/* Tamil Examples */}
            <div style={{ backgroundColor: 'white', padding: 'var(--spacing-sm)', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1976D2', fontSize: '14px' }}>
                🇮🇳 Tamil Examples (தமிழ்)
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
                <li><strong>"புதிய பொருள் வெண்ணெய் பத்து"</strong></li>
                <li><strong>"புதிய சாக்லேட் இருபது"</strong></li>
                <li><strong>"புதிதாக டீ முப்பது சேர்"</strong></li>
                <li><strong>"பதினைந்து காபி சேர்"</strong> (if not in inventory)</li>
              </ul>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                💡 பயன்படுத்துங்கள்: "புதிய பொருள்", "புதிய", "புதிதாக"
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div style={{
            marginTop: 'var(--spacing-sm)',
            padding: '8px',
            backgroundColor: '#fff3cd',
            borderRadius: '4px',
            border: '1px solid #ffc107'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
              ⚡ Quick Tips:
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '11px' }}>
              <li>Say "new product" or "புதிய பொருள்" to clearly indicate new product</li>
              <li>If product doesn't exist, it will be created automatically even without "new" keyword</li>
              <li>AI translates Tamil product names to English automatically</li>
              <li>Default unit is "piece" - you can edit it later</li>
            </ul>
          </div>
        </div>


        {/* Error/Success Messages */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--border-radius)',
            marginBottom: 'var(--spacing-lg)',
            border: '1px solid #f1b2b5'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--border-radius)',
            marginBottom: 'var(--spacing-lg)',
            border: '1px solid #c3e6cb'
          }}>
            {success}
          </div>
        )}

        {/* Undo Button */}
        {showUndoButton && hasUndoAction && (
          <div style={{
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--border-radius)',
            marginBottom: 'var(--spacing-lg)',
            border: '1px solid #bbdefb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '14px' }}>Action completed</span>
            <button
              onClick={handleUndo}
              style={{
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius)',
                padding: '4px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Undo
            </button>
          </div>
        )}

        {/* Day-Aware Hint */}
        {dayHint && (
          <div className="card slide-up" style={{
            marginBottom: 'var(--spacing-lg)',
            backgroundColor: '#f8f9fa',
            borderLeft: '4px solid #007bff'
          }}>
            <div style={{ fontSize: '14px', color: '#495057', fontWeight: 'bold' }}>
              📅 Today's Focus: {dayHint}
            </div>
          </div>
        )}

        {/* Inventory Health Score */}
        {healthScore !== undefined && (
          <div className="card slide-up" style={{
            marginBottom: 'var(--spacing-lg)',
            backgroundColor: '#ffffff',
            borderLeft: `4px solid ${healthScore >= 80 ? '#28a745' : healthScore >= 60 ? '#ffc107' : '#dc3545'}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--spacing-sm)'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#495057' }}>
                Inventory Health Score
              </h3>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: healthScore >= 80 ? '#28a745' : healthScore >= 60 ? '#ffc107' : '#dc3545'
              }}>
                {healthScore}/100
              </div>
            </div>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#6c757d'
            }}>
              {healthSummary}
            </p>
          </div>
        )}

        {/* Today's Inventory Tasks */}
        {todaysTasks.length > 0 && (
          <div className="card slide-up" style={{
            marginBottom: 'var(--spacing-lg)',
            backgroundColor: '#ffffff',
            borderLeft: '4px solid #17a2b8'
          }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#495057' }}>
              📝 Today's Inventory Tasks
            </h3>
            <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
              {todaysTasks.map((task, index) => (
                <div key={index} style={{
                  padding: 'var(--spacing-sm)',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 'var(--border-radius)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: `3px solid ${task.priority === 'high' ? '#dc3545' : task.priority === 'medium' ? '#ffc107' : '#28a745'}`
                }}>
                  <span style={{ fontSize: '14px' }}>{task.task}</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: task.priority === 'high' ? '#dc3545' : task.priority === 'medium' ? '#856404' : '#155724'
                  }}>
                    {task.priority.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock Alerts */}
        {alerts.length > 0 && (
          <div className="card slide-up" style={{
            marginBottom: 'var(--spacing-lg)',
            backgroundColor: '#fff3cd',
            borderLeft: '4px solid #ffc107'
          }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#856404' }}>
              ⚠️ Stock Alerts
            </h3>
            <p style={{ color: '#856404', marginBottom: 'var(--spacing-sm)' }}>
              {alerts.length} item(s) need attention
            </p>
            <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
              {alerts.map(alert => (
                <div key={alert._id} style={{
                  padding: 'var(--spacing-sm)',
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  borderRadius: 'var(--border-radius)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{alert.productName}</span>
                  <span style={{
                    ...getStockStatusStyle(alert.stockStatus),
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {alert.quantity} {alert.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Product Button */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              border: 'none',
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {showAddForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {/* Add Product Form */}
        {showAddForm && (
          <div className="card slide-up" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Add New Product</h3>
            <form onSubmit={handleAddProduct}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid #ddd',
                      borderRadius: 'var(--border-radius)',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid #ddd',
                      borderRadius: 'var(--border-radius)',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    min="0"
                    required
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid #ddd',
                      borderRadius: 'var(--border-radius)',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                    Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid #ddd',
                      borderRadius: 'var(--border-radius)',
                      fontSize: '14px'
                    }}
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kg</option>
                    <option value="gram">Gram</option>
                    <option value="liter">Liter</option>
                    <option value="packet">Packet</option>
                    <option value="box">Box</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                    Min Stock Level
                  </label>
                  <input
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                    min="0"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid #ddd',
                      borderRadius: 'var(--border-radius)',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid #ddd',
                      borderRadius: 'var(--border-radius)',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Pricing Information Section */}
              <div style={{
                marginTop: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-md)',
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--color-border)'
              }}>
                <h4 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-primary)' }}>
                  💰 Pricing Information (Optional)
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  Add pricing data to enable AI-powered offer recommendations
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--spacing-md)'
                }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 'bold' }}>
                      Cost Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter cost price"
                      value={formData.costPrice || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        costPrice: e.target.value ? Number(e.target.value) : undefined
                      })}
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-sm)',
                        border: '1px solid #ddd',
                        borderRadius: 'var(--border-radius)',
                        fontSize: '14px'
                      }}
                    />
                    <small style={{ color: 'var(--color-text-secondary)' }}>
                      Actual cost you pay for this product
                    </small>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 'bold' }}>
                      Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter selling price"
                      value={formData.sellingPrice || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        sellingPrice: e.target.value ? Number(e.target.value) : undefined
                      })}
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-sm)',
                        border: '1px solid #ddd',
                        borderRadius: 'var(--border-radius)',
                        fontSize: '14px'
                      }}
                    />
                    <small style={{ color: 'var(--color-text-secondary)' }}>
                      Current price you sell to customers
                    </small>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 'bold' }}>
                      MRP (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter MRP"
                      value={formData.mrp || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        mrp: e.target.value ? Number(e.target.value) : undefined
                      })}
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-sm)',
                        border: '1px solid #ddd',
                        borderRadius: 'var(--border-radius)',
                        fontSize: '14px'
                      }}
                    />
                    <small style={{ color: 'var(--color-text-secondary)' }}>
                      Maximum retail price (printed on product)
                    </small>
                  </div>
                </div>

                {/* Pricing Validation Messages */}
                {formData.costPrice && formData.sellingPrice && formData.sellingPrice < formData.costPrice && (
                  <div style={{
                    marginTop: 'var(--spacing-sm)',
                    padding: 'var(--spacing-sm)',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: 'var(--border-radius)',
                    color: '#c33',
                    fontSize: '14px'
                  }}>
                    ⚠️ Selling price should be greater than cost price
                  </div>
                )}

                {formData.sellingPrice && formData.mrp && formData.sellingPrice > formData.mrp && (
                  <div style={{
                    marginTop: 'var(--spacing-sm)',
                    padding: 'var(--spacing-sm)',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: 'var(--border-radius)',
                    color: '#c33',
                    fontSize: '14px'
                  }}>
                    ⚠️ Selling price should not exceed MRP
                  </div>
                )}

                {formData.costPrice && (
                  <div style={{
                    marginTop: 'var(--spacing-sm)',
                    padding: 'var(--spacing-sm)',
                    backgroundColor: '#e7f5e7',
                    border: '1px solid #b3d9b3',
                    borderRadius: 'var(--border-radius)',
                    color: '#2d5a2d',
                    fontSize: '14px'
                  }}>
                    ✅ Cost price added - AI offers will be available for this product!
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  border: 'none',
                  borderRadius: 'var(--border-radius)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Adding...' : 'Add Product'}
              </button>
            </form>
          </div>
        )}

        {/* Inventory List */}
        <div className="card slide-up" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-md)'
          }}>
            <h3>Your Inventory ({inventory.length} items)</h3>
            <button
              onClick={loadInventoryData}
              disabled={loading}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--color-primary)',
                color: 'var(--color-primary)',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--border-radius)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {inventory.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-xxl)',
              color: 'var(--color-text-secondary)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>📦</div>
              <p>No products in inventory yet.</p>
              <p>Start by adding your first product!</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--spacing-md)'
            }}>
              {inventory.map(item => (
                <div key={item._id} style={{
                  border: '1px solid #e9ecef',
                  borderRadius: 'var(--border-radius)',
                  padding: 'var(--spacing-md)',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>{item.productName}</h4>
                    <button
                      onClick={() => handleDeleteProduct(item._id)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '2px'
                      }}
                      title="Delete product"
                    >
                      🗑️
                    </button>
                  </div>

                  {item.category && (
                    <p style={{
                      margin: '0 0 var(--spacing-xs) 0',
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {item.category}
                    </p>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {item.quantity} {item.unit}
                    </span>
                    <span style={{
                      ...getStockStatusStyle(item.stockStatus),
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {item.stockStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Min: {item.minStockLevel} | Expires: {formatDate(item.expiryDate)}
                  </div>

                  {/* Enhanced Features Tags */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    {item.fastMoving && (
                      <span style={{
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        Fast mover
                      </span>
                    )}
                    {item.goodForOffer && (
                      <span style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        Good for Offer
                      </span>
                    )}
                  </div>

                  {/* Profit Margin Indicator */}
                  {item.margin && (
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: 'var(--spacing-xs)',
                      borderRadius: 'var(--border-radius)',
                      marginBottom: 'var(--spacing-sm)',
                      fontSize: '11px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>Profit Margin:</span>
                      <span style={{
                        fontWeight: 'bold',
                        color: item.margin.status === 'good' ? '#28a745' :
                          item.margin.status === 'fair' ? '#ffc107' : '#dc3545'
                      }}>
                        ₹{item.margin.margin} ({item.margin.marginPercentage}%)
                      </span>
                    </div>
                  )}

                  {/* Price Warnings */}
                  {item.priceWarnings && item.priceWarnings.length > 0 && (
                    <div style={{
                      backgroundColor: '#fff3cd',
                      color: '#856404',
                      padding: 'var(--spacing-xs)',
                      borderRadius: 'var(--border-radius)',
                      marginBottom: 'var(--spacing-sm)',
                      fontSize: '11px',
                      border: '1px solid #ffeaa7'
                    }}>
                      <strong>⚠️ Warning:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                        {item.priceWarnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Pricing Information */}
                  {(item.costPrice || item.sellingPrice || item.mrp) && (
                    <div style={{
                      backgroundColor: 'var(--color-background-secondary)',
                      padding: 'var(--spacing-sm)',
                      borderRadius: 'var(--border-radius)',
                      marginBottom: 'var(--spacing-sm)',
                      fontSize: '12px'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', color: 'var(--color-text-primary)' }}>
                        💰 Pricing Info:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-xs)' }}>
                        <div>
                          <strong>Cost:</strong><br />
                          {item.costPrice ? `₹${item.costPrice}` : 'N/A'}
                        </div>
                        <div>
                          <strong>Sell:</strong><br />
                          {item.sellingPrice ? `₹${item.sellingPrice}` : 'N/A'}
                        </div>
                        <div>
                          <strong>MRP:</strong><br />
                          {item.mrp ? `₹${item.mrp}` : 'N/A'}
                        </div>
                      </div>
                      {item.costPrice && (
                        <div style={{
                          marginTop: 'var(--spacing-xs)',
                          color: '#28a745',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          ✅ AI offers available
                        </div>
                      )}
                    </div>
                  )}

                  {/* No pricing data message */}
                  {!item.costPrice && !item.sellingPrice && !item.mrp && (
                    <div style={{
                      backgroundColor: '#fff3cd',
                      padding: 'var(--spacing-sm)',
                      borderRadius: 'var(--border-radius)',
                      marginBottom: 'var(--spacing-sm)',
                      fontSize: '11px',
                      color: '#856404',
                      textAlign: 'center'
                    }}>
                      💡 Add pricing data for AI offers
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: 'var(--spacing-xs)',
                    justifyContent: 'center'
                  }}>
                    <button
                      onClick={() => handleQuantityUpdate(item._id, -1)}
                      disabled={item.quantity <= 0}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: item.quantity <= 0 ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        opacity: item.quantity <= 0 ? 0.5 : 1
                      }}
                      title="Decrease quantity"
                    >
                      −
                    </button>

                    <button
                      onClick={() => handleQuantityUpdate(item._id, 1)}
                      style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Log */}
        {activityLogs.length > 0 && (
          <div className="card slide-up" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>📋 Recent Activity</h3>
            <div style={{ display: 'grid', gap: 'var(--spacing-xs)' }}>
              {activityLogs.slice(0, 10).map((log, index) => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const changeText = log.quantityChange > 0 ? `+${log.quantityChange}` : `${log.quantityChange}`;

                return (
                  <div key={index} style={{
                    padding: 'var(--spacing-sm)',
                    backgroundColor: '#f8f9fa',
                    borderRadius: 'var(--border-radius)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px'
                  }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{log.productName}</span>
                      <span style={{ color: '#6c757d', margin: '0 8px' }}>
                        {log.type === 'add' ? 'Added' : log.type === 'reduce' ? 'Reduced' :
                          log.type === 'undo' ? 'Undid' : 'Created'}
                      </span>
                      <span style={{
                        color: log.quantityChange > 0 ? '#28a745' : '#dc3545',
                        fontWeight: 'bold'
                      }}>
                        {changeText} {log.unit}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)',
                      fontSize: '11px',
                      color: '#6c757d'
                    }}>
                      <span>{timeStr}</span>
                      <span style={{
                        backgroundColor: log.source === 'voice' ? '#17a2b8' : log.source === 'undo' ? '#ffc107' : '#6c757d',
                        color: 'white',
                        padding: '1px 4px',
                        borderRadius: '8px',
                        fontSize: '10px'
                      }}>
                        {log.source}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Insights Panel */}
        {insights.length > 0 && (
          <div className="card slide-up">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>📊 Inventory Insights</h3>
            <div style={{ display: 'grid', gap: 'var(--spacing-xs)' }}>
              {insights.map((insight, index) => (
                <p key={index} style={{
                  margin: 0,
                  padding: 'var(--spacing-sm)',
                  backgroundColor: 'var(--color-background)',
                  borderRadius: 'var(--border-radius)',
                  fontSize: '14px'
                }}>
                  • {insight}
                </p>
              ))}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default Inventory;