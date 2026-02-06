import { useState, useCallback } from 'react';
import { InventoryItem } from '../services/inventoryService';
import { BasketItem } from '../utils/basketHelpers';

interface UseBasketDragDropProps {
  onDropToIncoming: (item: BasketItem) => void;
  onDropToOutgoing: (item: BasketItem) => void;
}

export const useBasketDragDrop = ({
  onDropToIncoming,
  onDropToOutgoing
}: UseBasketDragDropProps) => {
  const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);
  const [dragOverBasket, setDragOverBasket] = useState<string | null>(null);

  const handleDragStart = useCallback((item: InventoryItem) => {
    setDraggedItem(item);
    console.log('🎯 Drag started:', item.productName);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, basketType: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverBasket(basketType);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're leaving the basket area entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverBasket(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, basketType: 'incoming' | 'outgoing') => {
    e.preventDefault();
    
    try {
      // Get drag data
      const dragData = e.dataTransfer.getData('application/json');
      if (!dragData) {
        console.error('No drag data found');
        return;
      }

      const basketItem: BasketItem = JSON.parse(dragData);
      
      console.log('📦 Drop received:', basketItem, 'to', basketType);

      // Validate the drop
      if (!basketItem.productId || !basketItem.productName) {
        console.error('Invalid basket item data');
        return;
      }

      // Check stock availability for outgoing basket
      if (basketType === 'outgoing' && basketItem.availableStock && basketItem.availableStock < basketItem.quantity) {
        console.warn('Insufficient stock for outgoing basket');
        return;
      }

      // Route to appropriate handler
      if (basketType === 'incoming') {
        onDropToIncoming(basketItem);
      } else {
        onDropToOutgoing(basketItem);
      }

    } catch (error) {
      console.error('Error processing drop:', error);
    } finally {
      // Clean up drag state
      setDraggedItem(null);
      setDragOverBasket(null);
    }
  }, [onDropToIncoming, onDropToOutgoing]);

  const handleDragEnd = useCallback(() => {
    // Clean up drag state
    setDraggedItem(null);
    setDragOverBasket(null);
    console.log('🏁 Drag ended');
  }, []);

  // Touch support for mobile devices
  const handleTouchStart = useCallback((item: InventoryItem, e: React.TouchEvent) => {
    setDraggedItem(item);
    
    // Add visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.transform = 'scale(1.1)';
    target.style.zIndex = '1000';
    
    console.log('👆 Touch drag started:', item.productName);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    const touch = e.touches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Check if we're over a basket area
    const basketArea = elementBelow?.closest('.basket-area');
    if (basketArea) {
      const basketType = basketArea.getAttribute('data-basket-type');
      setDragOverBasket(basketType);
    } else {
      setDragOverBasket(null);
    }
  }, [draggedItem]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!draggedItem) return;

    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const basketArea = elementBelow?.closest('.basket-area');
    
    // Clean up visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.transform = '';
    target.style.zIndex = '';

    if (basketArea) {
      const basketType = basketArea.getAttribute('data-basket-type') as 'incoming' | 'outgoing';
      
      if (basketType) {
        // Create basket item from dragged item
        const basketItem: BasketItem = {
          productId: draggedItem._id,
          productName: draggedItem.productName,
          icon: '📦', // Will be set by the component
          quantity: 1,
          unit: draggedItem.unit,
          availableStock: draggedItem.quantity
        };

        // Route to appropriate handler
        if (basketType === 'incoming') {
          onDropToIncoming(basketItem);
        } else if (basketType === 'outgoing') {
          onDropToOutgoing(basketItem);
        }
      }
    }

    // Clean up state
    setDraggedItem(null);
    setDragOverBasket(null);
    
    console.log('👆 Touch drag ended');
  }, [draggedItem, onDropToIncoming, onDropToOutgoing]);

  return {
    draggedItem,
    dragOverBasket,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};