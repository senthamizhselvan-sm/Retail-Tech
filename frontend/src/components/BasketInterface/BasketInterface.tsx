import React, { useState, useEffect } from 'react';
import { InventoryItem, ActivityLog } from '../../services/inventoryService';
import { useBasketDragDrop } from '../../hooks/useBasketDragDrop';
import ProductShelf from './ProductShelf';
import BasketArea from './BasketArea';
import CashPot from './CashPot';
import VoiceCommandsForBasket from './VoiceCommandsForBasket';
import { BasketItem, BasketAction } from '../../utils/basketHelpers';

interface BasketInterfaceProps {
  inventory: InventoryItem[];
  onUpdate: (action: BasketAction) => Promise<void>;
  onVoiceCommand?: (command: string) => void;
  loading?: boolean;
}

const BasketInterface: React.FC<BasketInterfaceProps> = ({
  inventory,
  onUpdate,
  onVoiceCommand,
  loading = false
}) => {
  const [incomingBasket, setIncomingBasket] = useState<BasketItem[]>([]);
  const [outgoingBasket, setOutgoingBasket] = useState<BasketItem[]>([]);
  const [cashPotAmount, setCashPotAmount] = useState<number>(0);
  const [mode, setMode] = useState<'supplier' | 'customer'>('customer');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    draggedItem,
    dragOverBasket,
    handleDragStart,
    handleDragOver,
    handleDrop
  } = useBasketDragDrop({
    onDropToIncoming: (item) => addToIncomingBasket(item),
    onDropToOutgoing: (item) => addToOutgoingBasket(item)
  });

  // Add item to incoming basket (supplier mode)
  const addToIncomingBasket = (item: BasketItem) => {
    setIncomingBasket(prev => {
      const existing = prev.find(b => b.productId === item.productId);
      if (existing) {
        return prev.map(b => 
          b.productId === item.productId 
            ? { ...b, quantity: b.quantity + item.quantity }
            : b
        );
      }
      return [...prev, item];
    });
    playSound('drop');
  };

  // Add item to outgoing basket (customer mode)
  const addToOutgoingBasket = (item: BasketItem) => {
    const inventoryItem = inventory.find(inv => inv._id === item.productId);
    if (!inventoryItem || inventoryItem.quantity < item.quantity) {
      playSound('error');
      return;
    }

    setOutgoingBasket(prev => {
      const existing = prev.find(b => b.productId === item.productId);
      if (existing) {
        const newQuantity = existing.quantity + item.quantity;
        if (inventoryItem.quantity < newQuantity) {
          playSound('error');
          return prev;
        }
        return prev.map(b => 
          b.productId === item.productId 
            ? { ...b, quantity: newQuantity }
            : b
        );
      }
      return [...prev, item];
    });
    playSound('drop');
  };

  // Handle basket voice commands
  const handleBasketVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Mode switching
    if (lowerCommand.includes('supplier mode') || lowerCommand.includes('விற்பனையாளர்')) {
      setMode('supplier');
      playSound('mode-switch');
      return;
    }
    
    if (lowerCommand.includes('customer mode') || lowerCommand.includes('வாடிக்கையாளர்')) {
      setMode('customer');
      playSound('mode-switch');
      return;
    }

    // Basket actions
    if (lowerCommand.includes('confirm delivery') || lowerCommand.includes('டெலிவரி உறுதி')) {
      handleConfirmDelivery();
      return;
    }

    if (lowerCommand.includes('complete sale') || lowerCommand.includes('விற்பனை முடிவு')) {
      handleCompleteSale();
      return;
    }

    if (lowerCommand.includes('reset all') || lowerCommand.includes('அனைத்தும் ரீசெட்')) {
      handleResetAll();
      return;
    }

    // Pass to parent for general inventory commands
    if (onVoiceCommand) {
      onVoiceCommand(command);
    }
  };

  // Confirm delivery (supplier mode)
  const handleConfirmDelivery = async () => {
    if (mode !== 'supplier' || incomingBasket.length === 0) return;
    
    setIsProcessing(true);
    try {
      const action: BasketAction = {
        type: 'delivery',
        items: incomingBasket,
        timestamp: new Date(),
        mode: 'supplier'
      };
      
      await onUpdate(action);
      setIncomingBasket([]);
      playSound('success');
    } catch (error) {
      console.error('Delivery confirmation failed:', error);
      playSound('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Complete sale (customer mode)
  const handleCompleteSale = async () => {
    if (mode !== 'customer' || outgoingBasket.length === 0) return;
    
    setIsProcessing(true);
    try {
      const action: BasketAction = {
        type: 'sale',
        items: outgoingBasket,
        timestamp: new Date(),
        cashAmount: cashPotAmount,
        mode: 'customer'
      };
      
      await onUpdate(action);
      setOutgoingBasket([]);
      setCashPotAmount(0);
      playSound('success');
    } catch (error) {
      console.error('Sale completion failed:', error);
      playSound('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset all baskets
  const handleResetAll = () => {
    setIncomingBasket([]);
    setOutgoingBasket([]);
    setCashPotAmount(0);
    playSound('reset');
  };

  // Empty specific basket
  const handleEmptyBasket = (basketType: 'incoming' | 'outgoing') => {
    if (basketType === 'incoming') {
      setIncomingBasket([]);
    } else {
      setOutgoingBasket([]);
    }
    playSound('empty');
  };

  // Remove item from basket
  const handleRemoveFromBasket = (basketType: 'incoming' | 'outgoing', productId: string) => {
    if (basketType === 'incoming') {
      setIncomingBasket(prev => prev.filter(item => item.productId !== productId));
    } else {
      setOutgoingBasket(prev => prev.filter(item => item.productId !== productId));
    }
    playSound('remove');
  };

  // Update item quantity in basket
  const handleUpdateBasketQuantity = (
    basketType: 'incoming' | 'outgoing', 
    productId: string, 
    delta: number
  ) => {
    const updateBasket = basketType === 'incoming' ? setIncomingBasket : setOutgoingBasket;
    
    updateBasket(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        
        // Check stock limits for outgoing basket
        if (basketType === 'outgoing') {
          const inventoryItem = inventory.find(inv => inv._id === productId);
          if (inventoryItem && newQuantity > inventoryItem.quantity) {
            playSound('error');
            return item;
          }
        }
        
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
    
    playSound('update');
  };

  // Add cash to pot
  const handleAddCash = (amount: number) => {
    setCashPotAmount(prev => prev + amount);
    playSound('cash');
  };

  // Empty cash pot
  const handleEmptyCashPot = () => {
    setCashPotAmount(0);
    playSound('empty');
  };

  // Play sound effects
  const playSound = (type: string) => {
    // Simple audio feedback - can be enhanced with actual sound files
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different actions
      const frequencies: Record<string, number> = {
        'drop': 800,
        'success': 1000,
        'error': 300,
        'cash': 600,
        'remove': 400,
        'empty': 500,
        'reset': 700,
        'update': 750,
        'mode-switch': 900
      };
      
      oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Fallback - no sound
      console.log(`🔊 ${type} sound`);
    }
  };

  return (
    <div className="basket-container">
      {/* MODE SWITCHER */}
      <div className="mode-switcher">
        <button 
          className={mode === 'supplier' ? 'active' : ''}
          onClick={() => setMode('supplier')}
          disabled={loading || isProcessing}
        >
          📥 Supplier Mode (Add Stock)
        </button>
        <button 
          className={mode === 'customer' ? 'active' : ''}
          onClick={() => setMode('customer')}
          disabled={loading || isProcessing}
        >
          📤 Customer Mode (Sell)
        </button>
      </div>

      {/* VISUAL SHELF */}
      <ProductShelf 
        products={inventory}
        onDragStart={handleDragStart}
        draggedItem={draggedItem}
        disabled={loading || isProcessing}
      />

      {/* WORK AREA */}
      <div className="basket-work-area">
        {/* INCOMING BASKET */}
        <BasketArea
          type="incoming"
          items={incomingBasket}
          isActive={mode === 'supplier'}
          dragOverBasket={dragOverBasket}
          onDragOver={(e) => handleDragOver(e, 'incoming')}
          onDrop={(e) => handleDrop(e, 'incoming')}
          onEmpty={() => handleEmptyBasket('incoming')}
          onRemoveItem={(productId) => handleRemoveFromBasket('incoming', productId)}
          onUpdateQuantity={(productId, delta) => handleUpdateBasketQuantity('incoming', productId, delta)}
          disabled={loading || isProcessing}
        />

        {/* OUTGOING BASKET */}
        <BasketArea
          type="outgoing"
          items={outgoingBasket}
          isActive={mode === 'customer'}
          dragOverBasket={dragOverBasket}
          onDragOver={(e) => handleDragOver(e, 'outgoing')}
          onDrop={(e) => handleDrop(e, 'outgoing')}
          onEmpty={() => handleEmptyBasket('outgoing')}
          onRemoveItem={(productId) => handleRemoveFromBasket('outgoing', productId)}
          onUpdateQuantity={(productId, delta) => handleUpdateBasketQuantity('outgoing', productId, delta)}
          disabled={loading || isProcessing}
        />
      </div>

      {/* CASH POT */}
      <CashPot
        amount={cashPotAmount}
        onAddCash={handleAddCash}
        onEmpty={handleEmptyCashPot}
        disabled={loading || isProcessing || mode !== 'customer'}
      />

      {/* ACTION BUTTONS */}
      <div className="basket-actions">
        <button 
          onClick={handleConfirmDelivery} 
          disabled={mode !== 'supplier' || incomingBasket.length === 0 || loading || isProcessing}
          className="primary"
        >
          ✅ Confirm Delivery ({incomingBasket.length} items)
        </button>
        
        <button 
          onClick={handleCompleteSale} 
          disabled={mode !== 'customer' || outgoingBasket.length === 0 || loading || isProcessing}
          className="primary"
        >
          💰 Complete Sale (₹{cashPotAmount})
        </button>
        
        <button 
          onClick={handleResetAll} 
          className="secondary"
          disabled={loading || isProcessing}
        >
          🔄 Reset All
        </button>
      </div>

      {/* VOICE COMMANDS */}
      <VoiceCommandsForBasket 
        onVoiceCommand={handleBasketVoiceCommand}
        mode={mode}
        disabled={loading || isProcessing}
      />

      {/* PROCESSING INDICATOR */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-spinner">
            <div className="spinner"></div>
            <p>Processing basket action...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasketInterface;