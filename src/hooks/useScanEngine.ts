import { useState, useRef, useCallback, useEffect } from 'react';
import { InventoryItem, InventoryCountItem } from '@/contexts/inventory/types';
import { inventoryCountsApi, inventoryItemsApi } from '@/contexts/inventory/api';
import { useToast } from '@/hooks/use-toast';

export interface ScanEngineSettings {
  countId: string;
  attachFirstScan: boolean;
  autoSelectByBarcode: boolean;
  autoSwitchOnMatch: boolean;
  qtyPerScan: number;
  dedupeMs: number;
}

export interface ScanEngineState {
  currentItemId?: string;
  lastCode?: string;
  lastScanTime?: number;
  sessionIncrements: number;
  isProcessing: boolean;
}

export interface ScanEvent {
  type: 'ITEM_SELECTED' | 'SCAN_DETECTED' | 'SET_QTY';
  itemId?: string;
  code?: string;
  qty?: number;
}

export interface ScanEngineReturn {
  state: ScanEngineState;
  dispatch: (event: ScanEvent) => Promise<void>;
  reset: () => void;
}

export function useScanEngine(
  settings: ScanEngineSettings,
  items: InventoryItem[],
  countItems: InventoryCountItem[]
): ScanEngineReturn {
  const { toast } = useToast();
  
  const [state, setState] = useState<ScanEngineState>({
    sessionIncrements: 0,
    isProcessing: false,
  });

  const sessionIncrementsRef = useRef<number>(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAttachedRef = useRef<string | null>(null);

  // Helper functions
  const normalizeBarcode = (code: string): string => code.trim();

  const findItemByBarcodeInCount = useCallback((barcode: string): InventoryItem | null => {
    const normalizedCode = normalizeBarcode(barcode);
    if (!normalizedCode) return null;
    
    // Only search within items that are in this count (template-limited)
    const itemsInCount = items.filter(item => 
      countItems.some(ci => ci.item_id === item.id)
    );
    
    return itemsInCount.find(item => item.barcode === normalizedCode) || null;
  }, [items, countItems]);

  const getCurrentItem = useCallback((): InventoryItem | null => {
    if (!state.currentItemId) return null;
    return items.find(item => item.id === state.currentItemId) || null;
  }, [items, state.currentItemId]);

  const getCurrentCountItem = useCallback((): InventoryCountItem | null => {
    if (!state.currentItemId) return null;
    return countItems.find(ci => ci.item_id === state.currentItemId) || null;
  }, [countItems, state.currentItemId]);

  // Debounced persist function - uses same API as scan-gun
  const debouncedPersist = useCallback(async () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      const currentItem = getCurrentItem();
      const currentCountItem = getCurrentCountItem();
      
      if (currentItem && currentCountItem && sessionIncrementsRef.current > 0) {
        try {
          console.log('SCAN_ENGINE_PERSIST:', { 
            itemId: currentItem.id, 
            sessionIncrements: sessionIncrementsRef.current 
          });
          
          await inventoryCountsApi.bumpActual(settings.countId, currentItem.id, sessionIncrementsRef.current);
          
          // Reset session increments after successful persist
          setState(prev => ({ ...prev, sessionIncrements: 0 }));
          sessionIncrementsRef.current = 0;
          
        } catch (error) {
          console.error('SCAN_ENGINE_PERSIST_ERROR:', error);
          
          // Rollback optimistic update
          setState(prev => ({ ...prev, sessionIncrements: 0 }));
          sessionIncrementsRef.current = 0;
          
          // Show friendly error
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (errorMessage.includes('row-level security') || errorMessage.includes('permission')) {
            toast({
              title: 'Permission denied',
              description: 'You do not have permission to update this count',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Save failed',
              description: errorMessage,
              variant: 'destructive',
            });
          }
        }
      }
    }, 350); // Same 350ms timeout as scan-gun
  }, [getCurrentItem, getCurrentCountItem, settings.countId, toast]);

  // Main dispatch function
  const dispatch = useCallback(async (event: ScanEvent) => {
    if (state.isProcessing) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      switch (event.type) {
        case 'ITEM_SELECTED':
          if (event.itemId) {
            setState(prev => ({
              ...prev,
              currentItemId: event.itemId,
              sessionIncrements: 0,
            }));
            sessionIncrementsRef.current = 0;
          }
          break;

        case 'SCAN_DETECTED':
          if (!event.code) break;
          
          const normalizedCode = normalizeBarcode(event.code);
          if (!normalizedCode) break;

          // Dedupe check
          const now = Date.now();
          if (state.lastCode === normalizedCode && 
              state.lastScanTime && 
              (now - state.lastScanTime) < settings.dedupeMs) {
            console.log('SCAN_ENGINE_DEDUPE:', { code: normalizedCode, timeSince: now - state.lastScanTime });
            break;
          }

          setState(prev => ({
            ...prev,
            lastCode: normalizedCode,
            lastScanTime: now,
          }));

          const currentItem = getCurrentItem();
          if (!currentItem) {
            toast({
              title: 'No item selected',
              description: 'Please select an item first',
              variant: 'destructive',
            });
            break;
          }

          // Auto-select by barcode if enabled
          if (settings.autoSelectByBarcode) {
            const foundItem = findItemByBarcodeInCount(normalizedCode);
            if (foundItem && foundItem.id !== currentItem.id) {
              console.log('SCAN_ENGINE_AUTO_SELECT:', { foundItem: foundItem.name });
              
              if (settings.autoSwitchOnMatch) {
                // Auto-switch: save current and switch
                if (sessionIncrementsRef.current > 0) {
                  await debouncedPersist();
                }
                setState(prev => ({
                  ...prev,
                  currentItemId: foundItem.id,
                  sessionIncrements: 0,
                }));
                sessionIncrementsRef.current = 0;
                
                // Process increment for new item
                sessionIncrementsRef.current += settings.qtyPerScan;
                setState(prev => ({ ...prev, sessionIncrements: sessionIncrementsRef.current }));
                
                // Haptic feedback
                if (navigator.vibrate) {
                  navigator.vibrate(50);
                }
                
                toast({
                  title: `Switched to ${foundItem.name}`,
                  description: `+${settings.qtyPerScan} scanned`,
                  duration: 2000,
                });
                
                debouncedPersist();
              } else {
                // Show confirmation to switch
                toast({
                  title: `Scanned ${foundItem.name}`,
                  description: 'Tap to switch to this item',
                });
              }
              break;
            }
            
            if (!foundItem) {
              toast({
                title: 'Item not in this count',
                description: `Barcode ${normalizedCode} not found in current count`,
                variant: 'destructive',
              });
              break;
            }
          }

          // Check barcode match for current item
          if (currentItem.barcode) {
            if (normalizedCode !== currentItem.barcode) {
              console.log('SCAN_ENGINE_BARCODE_MISMATCH:', { 
                scanned: normalizedCode, 
                expected: currentItem.barcode 
              });
              toast({
                title: 'Not this item',
                description: `Scanned ${normalizedCode}, expected ${currentItem.barcode}`,
                variant: 'destructive',
              });
              break;
            }
          } else {
            // Item has no barcode - handle attachment
            if (settings.attachFirstScan && currentItem && !currentItem.barcode) {
              try {
                // Prevent double-attach on same scan burst
                if (lastAttachedRef.current === normalizedCode) break;
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
                break; // Abort counting for this scan on error
              }
            }
          }

          // Accept scan - increment optimistically
          sessionIncrementsRef.current += settings.qtyPerScan;
          setState(prev => ({ ...prev, sessionIncrements: sessionIncrementsRef.current }));

          console.log('SCAN_ENGINE_INCREMENT:', { 
            qtyPerScan: settings.qtyPerScan, 
            newSessionTotal: sessionIncrementsRef.current 
          });

          // Haptic feedback
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }

          // Show feedback toast
          const currentCountItem = getCurrentCountItem();
          const currentActual = currentCountItem?.actual_quantity || 0;
          const newInStock = currentActual + sessionIncrementsRef.current;
          toast({
            title: `+${settings.qtyPerScan} scanned`,
            description: `${currentItem.name} • In-Stock: ${newInStock}`,
            duration: 2000,
          });

          // Debounced persist
          debouncedPersist();
          break;

        case 'SET_QTY':
          if (event.qty !== undefined && state.currentItemId) {
            try {
              await inventoryCountsApi.setActual(settings.countId, state.currentItemId, event.qty);
              setState(prev => ({ ...prev, sessionIncrements: 0 }));
              sessionIncrementsRef.current = 0;
            } catch (error) {
              console.error('SCAN_ENGINE_SET_QTY_ERROR:', error);
              toast({
                title: 'Failed to set quantity',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive',
              });
            }
          }
          break;
      }
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [
    state.isProcessing, 
    state.lastCode, 
    state.lastScanTime,
    settings,
    getCurrentItem,
    getCurrentCountItem,
    findItemByBarcodeInCount,
    debouncedPersist,
    toast
  ]);

  // Reset function
  const reset = useCallback(() => {
    setState({
      sessionIncrements: 0,
      isProcessing: false,
    });
    sessionIncrementsRef.current = 0;
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    dispatch,
    reset,
  };
}