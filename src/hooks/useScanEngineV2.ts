import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { InventoryItem, InventoryCountItem } from '@/contexts/inventory/types';
import { inventoryCountsApi, inventoryItemsApi } from '@/contexts/inventory/api';
import { useToast } from '@/hooks/use-toast';
import { useScanGun } from '@/hooks/useScanGun';

export interface ScanEngineV2Settings {
  countId: string;
  globalScanMode: boolean;
  attachFirstScan: boolean;
  autoSwitchOnMatch: boolean;
  qtyPerScan: number;
  dedupeMs: number;
}

export interface ScanEngineV2State {
  currentItemId?: string;
  lastCode?: string;
  lastScanTime?: number;
  isProcessing: boolean;
}

// Per-item pending deltas to prevent flicker
interface PendingByItem {
  [itemId: string]: number;
}

// Per-item persistence locks to prevent concurrent requests
interface PersistingByItem {
  [itemId: string]: boolean;
}

export interface ScanEngineV2Return {
  state: ScanEngineV2State;
  pendingByItem: PendingByItem;
  scannerConnected: boolean;
  isListening: boolean;
  getDisplayActual: (itemId: string) => number;
  selectItem: (itemId: string) => void;
  applyIncrement: (itemId: string, delta: number) => Promise<void>;
  setQuantity: (itemId: string, qty: number) => Promise<void>;
  reset: () => void;
}

export function useScanEngineV2(
  settings: ScanEngineV2Settings,
  items: InventoryItem[],
  countItems: InventoryCountItem[]
): ScanEngineV2Return {
  const { toast } = useToast();
  
  const [state, setState] = useState<ScanEngineV2State>({
    isProcessing: false,
  });

  // Per-item pending deltas (the key to fixing flicker)
  const [pendingByItem, setPendingByItem] = useState<PendingByItem>({});
  
  // Per-item persistence locks and debounce timeouts
  const persistingByItemRef = useRef<PersistingByItem>({});
  const debounceTimeoutsRef = useRef<{ [itemId: string]: NodeJS.Timeout }>({});
  const lastAttachedRef = useRef<string | null>(null);

  // Build barcode to count item index for global scanning
  const barcodeIndex = useMemo(() => {
    const index: { [barcode: string]: string } = {};
    
    // Only index items that are in this count (not full catalog)
    const itemsInCount = items.filter(item => 
      countItems.some(ci => ci.item_id === item.id)
    );
    
    itemsInCount.forEach(item => {
      if (item.barcode) {
        const normalizedBarcode = item.barcode.trim();
        if (normalizedBarcode) {
          index[normalizedBarcode] = item.id;
        }
      }
    });
    
    return index;
  }, [items, countItems]);

  // Helper to get display actual (server + pending)
  const getDisplayActual = useCallback((itemId: string): number => {
    const countItem = countItems.find(ci => ci.item_id === itemId);
    const serverActual = countItem?.actual_quantity || 0;
    const pending = pendingByItem[itemId] || 0;
    return serverActual + pending;
  }, [countItems, pendingByItem]);

  // Helper functions
  const normalizeBarcode = (code: string): string => code.trim();

  const getCurrentItem = useCallback((): InventoryItem | null => {
    if (!state.currentItemId) return null;
    return items.find(item => item.id === state.currentItemId) || null;
  }, [items, state.currentItemId]);

  const getCurrentCountItem = useCallback((): InventoryCountItem | null => {
    if (!state.currentItemId) return null;
    return countItems.find(ci => ci.item_id === state.currentItemId) || null;
  }, [countItems, state.currentItemId]);

  // Per-item debounced persist function (prevents interference between items)
  const debouncedPersistForItem = useCallback(async (itemId: string) => {
    // Clear existing timeout for this item
    if (debounceTimeoutsRef.current[itemId]) {
      clearTimeout(debounceTimeoutsRef.current[itemId]);
    }

    debounceTimeoutsRef.current[itemId] = setTimeout(async () => {
      const pendingDelta = pendingByItem[itemId];
      
      // Prevent concurrent persistence operations for this item
      if (persistingByItemRef.current[itemId] || !pendingDelta || pendingDelta <= 0) {
        return;
      }
      
      persistingByItemRef.current[itemId] = true;
      
      try {
        console.log('SCANENGINE_V2_PERSIST:', { itemId, pendingDelta });
        
        await inventoryCountsApi.bumpActual(settings.countId, itemId, pendingDelta);
        
        // Success: clear pending for this item only
        setPendingByItem(prev => ({
          ...prev,
          [itemId]: 0
        }));
        
      } catch (error) {
        console.error('SCANENGINE_V2_PERSIST_ERROR:', error);
        
        // Don't clear pending on error - show toast and retry on next scan
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('row-level security') || errorMessage.includes('permission')) {
          toast({
            title: 'Permission denied',
            description: 'You do not have permission to update this count',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Save failed — will retry on next scan',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      } finally {
        persistingByItemRef.current[itemId] = false;
      }
    }, 350); // Same timeout as original
  }, [pendingByItem, settings.countId, toast]);

  // Apply increment with per-item pending state
  const applyIncrement = useCallback(async (itemId: string, delta: number) => {
    if (state.isProcessing) return;

    // Increment pending for this item
    setPendingByItem(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + delta
    }));

    console.log('SCANENGINE_V2_INCREMENT:', { itemId, delta });

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Show feedback toast
    const item = items.find(i => i.id === itemId);
    if (item) {
      const newDisplayActual = getDisplayActual(itemId) + delta;
      toast({
        title: `+${delta} scanned`,
        description: `${item.name} • In-Stock: ${newDisplayActual}`,
        duration: 2000,
      });
    }

    // Debounced persist for this item
    debouncedPersistForItem(itemId);
  }, [state.isProcessing, items, getDisplayActual, toast, debouncedPersistForItem]);

  // Handle scan detection with global scanning support
  const handleScanDetected = useCallback(async (code: string) => {
    console.log('SCANENGINE_V2_SCAN_DETECTED:', { code, globalMode: settings.globalScanMode });
    
    const normalizedCode = normalizeBarcode(code);
    if (!normalizedCode) return;

    // Dedupe check
    const now = Date.now();
    if (state.lastCode === normalizedCode && 
        state.lastScanTime && 
        (now - state.lastScanTime) < settings.dedupeMs) {
      console.log('SCANENGINE_V2_DEDUPE:', { code: normalizedCode, timeSince: now - state.lastScanTime });
      return;
    }

    setState(prev => ({
      ...prev,
      lastCode: normalizedCode,
      lastScanTime: now,
      isProcessing: true,
    }));

    try {
      let targetItemId = state.currentItemId;

      // Global scanning mode: find item by barcode across all count items
      if (settings.globalScanMode) {
        const foundItemId = barcodeIndex[normalizedCode];
        if (foundItemId) {
          console.log('SCANENGINE_V2_GLOBAL_MATCH:', { barcode: normalizedCode, itemId: foundItemId });
          
          if (settings.autoSwitchOnMatch) {
            // Auto-switch to the found item
            setState(prev => ({ ...prev, currentItemId: foundItemId }));
            targetItemId = foundItemId;
            
            const foundItem = items.find(i => i.id === foundItemId);
            if (foundItem) {
              toast({
                title: `Switched to ${foundItem.name}`,
                description: `Auto-selected by barcode ${normalizedCode}`,
                duration: 2000,
              });
            }
          } else {
            // Show confirmation to switch
            const foundItem = items.find(i => i.id === foundItemId);
            if (foundItem) {
              toast({
                title: `Found ${foundItem.name}`,
                description: 'Tap to switch to this item',
              });
            }
            return;
          }
        } else {
          // Barcode not in count index
          if (settings.attachFirstScan && state.currentItemId) {
            // Attach to current item only (not arbitrary item)
            const currentItem = getCurrentItem();
            if (currentItem && !currentItem.barcode) {
              try {
                // Prevent double-attach on same scan burst
                if (lastAttachedRef.current === normalizedCode) return;
                lastAttachedRef.current = normalizedCode;
                setTimeout(() => (lastAttachedRef.current = null), 1000);

                await inventoryItemsApi.update(currentItem.id, { barcode: normalizedCode });

                toast({ 
                  title: 'Barcode attached', 
                  description: `${normalizedCode} → ${currentItem.name}` 
                });
                
                // Continue to increment after successful attach
                targetItemId = currentItem.id;
              } catch (e: any) {
                toast({
                  title: 'Failed to attach barcode',
                  description: e?.message ?? 'Could not attach barcode',
                  variant: 'destructive',
                });
                return;
              }
            } else {
              toast({
                title: 'Barcode not in this count',
                description: `${normalizedCode} not found`,
                variant: 'destructive',
              });
              return;
            }
          } else {
            toast({
              title: 'Barcode not in this count',
              description: `${normalizedCode} not found`,
              variant: 'destructive',
            });
            return;
          }
        }
      } else {
        // Non-global mode: check current item
        const currentItem = getCurrentItem();
        if (!currentItem) {
          toast({
            title: 'No item selected',
            description: 'Please select an item first',
            variant: 'destructive',
          });
          return;
        }

        // Check barcode match for current item
        if (currentItem.barcode) {
          if (normalizedCode !== currentItem.barcode) {
            toast({
              title: 'Not this item',
              description: `Scanned ${normalizedCode}, expected ${currentItem.barcode}`,
              variant: 'destructive',
            });
            return;
          }
        } else {
          // Item has no barcode - handle attachment
          if (settings.attachFirstScan) {
            try {
              // Prevent double-attach on same scan burst
              if (lastAttachedRef.current === normalizedCode) return;
              lastAttachedRef.current = normalizedCode;
              setTimeout(() => (lastAttachedRef.current = null), 1000);

              await inventoryItemsApi.update(currentItem.id, { barcode: normalizedCode });

              toast({ 
                title: 'Barcode attached', 
                description: `${normalizedCode} → ${currentItem.name}` 
              });
              
              // Continue to increment after successful attach
            } catch (e: any) {
              toast({
                title: 'Failed to attach barcode',
                description: e?.message ?? 'Could not attach barcode',
                variant: 'destructive',
              });
              return;
            }
          }
        }

        targetItemId = currentItem.id;
      }

      // Apply increment to target item
      if (targetItemId) {
        await applyIncrement(targetItemId, settings.qtyPerScan);
      }

    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [
    state.lastCode, 
    state.lastScanTime, 
    state.currentItemId,
    settings,
    barcodeIndex,
    items,
    getCurrentItem,
    applyIncrement,
    toast
  ]);

  // Initialize scan gun
  const { isListening, scannerConnected, reset: resetScanGun } = useScanGun({
    onScan: handleScanDetected,
    onStart: () => console.log('SCANENGINE_V2_START'),
    onStop: () => console.log('SCANENGINE_V2_STOP'),
    enabled: true,
  });

  // Select item function
  const selectItem = useCallback((itemId: string) => {
    setState(prev => ({ ...prev, currentItemId: itemId }));
  }, []);

  // Set quantity function
  const setQuantity = useCallback(async (itemId: string, qty: number) => {
    try {
      await inventoryCountsApi.setActual(settings.countId, itemId, qty);
      
      // Clear pending for this item since we set absolute value
      setPendingByItem(prev => ({
        ...prev,
        [itemId]: 0
      }));
      
    } catch (error) {
      console.error('SCANENGINE_V2_SET_QTY_ERROR:', error);
      toast({
        title: 'Failed to set quantity',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [settings.countId, toast]);

  // Reset function
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
    });
    setPendingByItem({});
    persistingByItemRef.current = {};
    
    // Clear all debounce timeouts
    Object.values(debounceTimeoutsRef.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    debounceTimeoutsRef.current = {};
    
    resetScanGun();
  }, [resetScanGun]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    state,
    pendingByItem,
    scannerConnected,
    isListening,
    getDisplayActual,
    selectItem,
    applyIncrement,
    setQuantity,
    reset,
  };
}