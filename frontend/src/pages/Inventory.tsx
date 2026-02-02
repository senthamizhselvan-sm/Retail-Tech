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

const Inventory: React.FC = () => {
  const { } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
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
  const [voiceCommand, setVoiceCommand] = useState('');

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

  // Voice command handlers
  const handleInventoryVoice = (transcript: string) => {
    setVoiceCommand(transcript);
    parseInventoryCommand(transcript);
  };

  const parseInventoryCommand = async (text: string) => {
    const lower = text.toLowerCase().trim();
    
    // Clean up text: remove punctuation and normalize
    const cleanText = lower.replace(/[.,!?;]+$/g, ''); // Remove trailing punctuation

    // Pattern: "add new product rice 10 kg" or "create product sugar 5 packet"
    const addNewProductMatch = cleanText.match(
      /(add new product|create product) ([a-zA-Z\s]+) (\d+) (kg|gram|liter|packet|piece|box|dozen)/
    );

    if (addNewProductMatch) {
      const productName = normalizeProductName(addNewProductMatch[2]);
      const quantity = Number(addNewProductMatch[3]);
      const unit = addNewProductMatch[4];

      return addNewProductViaVoice(productName, quantity, unit);
    }

    // Pattern: "sold X packets of rice" or "sold X rice"
    const soldMatch = cleanText.match(/sold (\d+) (?:(?:packets|pieces|kg|gram|liter|box|dozen) (?:of )?)?([a-zA-Z\s]+)/);
    if (soldMatch) {
      const productName = normalizeProductName(soldMatch[2]);
      return updateInventoryByName(productName, -Number(soldMatch[1]));
    }

    // Pattern: "add X rice" or "add X packets rice"
    const addMatch = cleanText.match(/add (\d+) (?:(?:packets|pieces|kg|gram|liter|box|dozen) (?:of )?)?([a-zA-Z\s]+)/);
    if (addMatch) {
      const productName = normalizeProductName(addMatch[2]);
      return updateInventoryByName(productName, Number(addMatch[1]));
    }

    // Pattern: "reduce rice by X" or "reduce X rice"
    const reduceMatch = cleanText.match(/reduce (?:([a-zA-Z\s]+) by (\d+)|(\d+) ([a-zA-Z\s]+))/);
    if (reduceMatch) {
      const productName = normalizeProductName(reduceMatch[1] || reduceMatch[4]);
      const quantity = Number(reduceMatch[2] || reduceMatch[3]);
      return updateInventoryByName(productName, -quantity);
    }

    // If regex fails → fallback to Gemini
    await sendCommandToGemini(text);
  };

  // Helper function to normalize product names (handle plurals, trim, etc.)
  const normalizeProductName = (productName: string): string => {
    let normalized = productName.trim();
    
    // Remove common plural endings
    if (normalized.endsWith('s') && normalized.length > 3) {
      // Check if it's likely a plural (but avoid words that naturally end in 's')
      const singularForm = normalized.slice(0, -1);
      
      // Common patterns: boxes->box, glasses->glass, etc.
      if (normalized.endsWith('es')) {
        normalized = normalized.slice(0, -2);
      } else if (!['glass', 'dress', 'class', 'mass'].includes(normalized)) {
        normalized = singularForm;
      }
    }
    
    return normalized;
  };

  const updateInventoryByName = async (productName: string, delta: number) => {
    const cleanProductName = productName.trim().toLowerCase();
    
    // Try exact match first
    let item = inventory.find(i =>
      i.productName.toLowerCase() === cleanProductName
    );
    
    // If no exact match, try partial match
    if (!item) {
      item = inventory.find(i =>
        i.productName.toLowerCase().includes(cleanProductName) ||
        cleanProductName.includes(i.productName.toLowerCase())
      );
    }
    
    // Try with normalized product name (handle plurals)
    if (!item) {
      const normalizedSearch = normalizeProductName(cleanProductName);
      item = inventory.find(i => {
        const normalizedInventoryName = normalizeProductName(i.productName.toLowerCase());
        return normalizedInventoryName === normalizedSearch ||
               normalizedInventoryName.includes(normalizedSearch) ||
               normalizedSearch.includes(normalizedInventoryName);
      });
    }

    if (!item) {
      // Suggest closest matches
      const suggestions = inventory
        .filter(i => i.productName.toLowerCase().includes(cleanProductName.slice(0, 3)))
        .slice(0, 3)
        .map(i => i.productName);
      
      const suggestionText = suggestions.length > 0 
        ? ` Did you mean: ${suggestions.join(', ')}?`
        : ` Available products: ${inventory.slice(0, 5).map(i => i.productName).join(', ')}`;
      
      setError(`Product "${productName}" not found.${suggestionText}`);
      return;
    }

    try {
      const response = await inventoryService.updateQuantity(item._id, delta, 'voice');
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
      
      // Voice confirmation feedback
      const changeText = delta > 0 ? `+${delta}` : `${delta}`;
      setSuccess(`Updated ${item.productName}: ${changeText} ${item.unit}`);
      setVoiceCommand(''); // Clear command
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update inventory');
    }
  };

  const addNewProductViaVoice = async (
    productName: string,
    quantity: number,
    unit: string
  ) => {
    // Check if product already exists
    const existing = inventory.find(
      i => i.productName.toLowerCase() === productName.toLowerCase()
    );

    if (existing) {
      setError(`Product "${productName}" already exists. Try updating quantity.`);
      return;
    }

    try {
      await inventoryService.addProduct({
        productName,
        quantity,
        unit,
        minStockLevel: 5
      });

      await loadInventoryData();
      setSuccess(`Product "${productName}" added successfully`);
      setVoiceCommand('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add product');
    }
  };

  const sendCommandToGemini = async (command: string) => {
    try {
      const response = await fetch('/api/inventory/voice-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ command })
      });

      if (!response.ok) {
        throw new Error('Failed to process command');
      }

      await loadInventoryData();
      setSuccess('Inventory updated via voice');
      setVoiceCommand(''); // Clear command
    } catch (err) {
      setError('Could not understand command. Try: "sold 5 rice" or "add 10 sugar"');
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
              disabled={loading}
            />
          </div>
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
      </div>
    </div>
  );
};

export default Inventory;