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

// Per-item pending deltas to prevent flicker (using countItemId as key)
interface PendingByItem {
  [countItemId: string]: number;
}

// Per-item persistence locks to prevent concurrent requests (using countItemId as key)
interface PersistingByItem {
  [countItemId: string]: boolean;
}

// Last confirmed server values per count item
interface LastConfirmedByItem {
  [countItemId: string]: number;
}

export interface ScanEngineV2Return {
  state: ScanEngineV2State;
  pendingByItem: PendingByItem;
  scannerConnected: boolean;
  isListening: boolean;
  getDisplayActual: (itemId: string) => number; // catalog itemId input for UI convenience
  selectItem: (itemId: string) => void; // catalog itemId input
  applyIncrement: (itemId: string, delta: number) => Promise<void>; // catalog itemId input
  setQuantity: (itemId: string, qty: number) => Promise<void>; // catalog itemId input
  onItemsRefetched: (items: Array<{ id: string; actual_quantity: number }>) => void;
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

  // Per-item pending deltas (the key to fixing flicker) - keyed by countItemId
  const [pendingByItem, setPendingByItem] = useState<PendingByItem>({});
  
  // Per-item persistence locks and debounce timeouts - keyed by countItemId
  const persistingByItemRef = useRef<PersistingByItem>({});
  const debounceTimeoutsRef = useRef<{ [countItemId: string]: NodeJS.Timeout }>({});
  const lastConfirmedRef = useRef<LastConfirmedByItem>({});
  const lastAttachedRef = useRef<string | null>(null);

  // Build barcode to count item ID index for global scanning
  const barcodeIndex = useMemo(() => {
    const index: { [barcode: string]: string } = {};
    
    // Only index items that are in this count (not full catalog)
    // Map barcode -> countItemId (inventory_count_items.id)
    countItems.forEach(countItem => {
      const catalogItem = items.find(item => item.id === countItem.item_id);
      if (catalogItem?.barcode) {
        const normalizedBarcode = catalogItem.barcode.trim();
        if (normalizedBarcode) {
          index[normalizedBarcode] = countItem.id; // Store countItemId, not catalogItemId
        }
      }
    });
    
    return index;
  }, [items, countItems]);

  // Helper to get display actual (server + pending) - takes catalog itemId for UI convenience
  const getDisplayActual = useCallback((catalogItemId: string): number => {
    const countItem = countItems.find(ci => ci.item_id === catalogItemId);
    if (!countItem) return 0;
    
    const countItemId = countItem.id;
    const serverActual = countItem.actual_quantity || 0;
    const pending = pendingByItem[countItemId] || 0;
    const lastConfirmed = lastConfirmedRef.current[countItemId] || 0;
    const base = Math.max(serverActual, lastConfirmed);
    
    console.log('[RENDER]', {
      catalogItemId,
      countItemId,
      serverActual,
      pending,
      lastConfirmed,
      displayValue: base + pending
    });
    
    return base + pending;
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
  const debouncedPersistForItem = useCallback(async (countItemId: string) => {
    // Clear existing timeout for this item
    if (debounceTimeoutsRef.current[countItemId]) {
      clearTimeout(debounceTimeoutsRef.current[countItemId]);
    }

    debounceTimeoutsRef.current[countItemId] = setTimeout(async () => {
      const pendingDelta = pendingByItem[countItemId];
      
      // Prevent concurrent persistence operations for this item
      if (persistingByItemRef.current[countItemId] || !pendingDelta || pendingDelta <= 0) {
        return;
      }
      
      persistingByItemRef.current[countItemId] = true;
      
      try {
        console.log('[BUMP_REQUEST]', { countItemId, pendingDelta });
        
        // CRITICAL: Pass countItemId, not catalog item ID
        await inventoryCountsApi.bumpActual(settings.countId, countItemId, pendingDelta);
        
        // DO NOT clear pending here - wait for refetch confirmation
        console.log('[BUMP_RESPONSE]', { countItemId, pendingDelta, status: 'success' });
        
      } catch (error) {
        console.error('[BUMP_FAIL]', { countItemId, pendingDelta, error });
        
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
        persistingByItemRef.current[countItemId] = false;
      }
    }, 350); // Same timeout as original
  }, [pendingByItem, settings.countId, toast]);

  // Apply increment with per-item pending state - takes catalog itemId for UI convenience
  const applyIncrement = useCallback(async (catalogItemId: string, delta: number) => {
    if (state.isProcessing) return;

    // Find the count item to get the countItemId
    const countItem = countItems.find(ci => ci.item_id === catalogItemId);
    if (!countItem) {
      console.error('[INCREMENT_ERROR]', { catalogItemId, error: 'Count item not found' });
      return;
    }
    
    const countItemId = countItem.id;
    const serverActual = countItem.actual_quantity || 0;
    
    // Record baseline so we don't render lower than what we've seen confirmed
    lastConfirmedRef.current[countItemId] = Math.max(lastConfirmedRef.current[countItemId] || 0, serverActual);

    // Increment pending for this count item
    setPendingByItem(prev => ({
      ...prev,
      [countItemId]: (prev[countItemId] || 0) + delta
    }));

    console.log('[INCREMENT]', { catalogItemId, countItemId, delta, pendingBefore: pendingByItem[countItemId] ?? 0 });

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Show feedback toast
    const item = items.find(i => i.id === catalogItemId);
    if (item) {
      const newDisplayActual = getDisplayActual(catalogItemId);
      toast({
        title: `+${delta} scanned`,
        description: `${item.name} • In-Stock: ${newDisplayActual}`,
        duration: 2000,
      });
    }

    // Debounced persist for this count item
    debouncedPersistForItem(countItemId);
  }, [state.isProcessing, items, countItems, getDisplayActual, toast, debouncedPersistForItem, pendingByItem]);

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
        const foundCountItemId = barcodeIndex[normalizedCode];
        if (foundCountItemId) {
          // Find the catalog item for this count item
          const foundCountItem = countItems.find(ci => ci.id === foundCountItemId);
          const foundCatalogItem = foundCountItem ? items.find(i => i.id === foundCountItem.item_id) : null;
          
          console.log('[SCANENGINE_V2_GLOBAL_MATCH]', { 
            barcode: normalizedCode, 
            countItemId: foundCountItemId,
            catalogItemId: foundCatalogItem?.id
          });
          
          if (settings.autoSwitchOnMatch && foundCatalogItem) {
            // Auto-switch to the found item (using catalog item ID for UI state)
            setState(prev => ({ ...prev, currentItemId: foundCatalogItem.id }));
            targetItemId = foundCatalogItem.id;
            
            toast({
              title: `Switched to ${foundCatalogItem.name}`,
              description: `Auto-selected by barcode ${normalizedCode}`,
              duration: 2000,
            });
          } else if (foundCatalogItem) {
            // Show confirmation to switch
            toast({
              title: `Found ${foundCatalogItem.name}`,
              description: 'Tap to switch to this item',
            });
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

  // Set quantity function - takes catalog itemId for UI convenience
  const setQuantity = useCallback(async (catalogItemId: string, qty: number) => {
    // Find the count item to get the countItemId
    const countItem = countItems.find(ci => ci.item_id === catalogItemId);
    if (!countItem) {
      console.error('[SET_QTY_ERROR]', { catalogItemId, error: 'Count item not found' });
      return;
    }
    
    const countItemId = countItem.id;
    
    try {
      await inventoryCountsApi.setActual(settings.countId, countItemId, qty);
      
      // Clear pending for this count item since we set absolute value
      setPendingByItem(prev => ({
        ...prev,
        [countItemId]: 0
      }));
      
    } catch (error) {
      console.error('[SET_QTY_ERROR]', { catalogItemId, countItemId, qty, error });
      toast({
        title: 'Failed to set quantity',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [settings.countId, countItems, toast]);

  // PUBLIC: call this when count items are (re)fetched to clear confirmed pending state
  const onItemsRefetched = useCallback((items: Array<{ id: string; actual_quantity: number }>) => {
    console.log('[REFETCHED_ITEMS]', items.map(i => ({ id: i.id, actual: i.actual_quantity })));
    setPendingByItem(prev => {
      const next = { ...prev };
      for (const ci of items) {
        const countItemId = ci.id;
        const pending = prev[countItemId] ?? 0;
        const lastConfirmed = lastConfirmedRef.current[countItemId] ?? 0;
        const mustBe = lastConfirmed + pending;
        const server = ci.actual_quantity ?? 0;
        // server "caught up" → clear pending & update lastConfirmed
        if (server >= mustBe) {
          next[countItemId] = 0;
          lastConfirmedRef.current[countItemId] = server;
        } else {
          // server behind; keep pending sticky
          lastConfirmedRef.current[countItemId] = Math.max(lastConfirmed, server);
        }
      }
      return next;
    });
  }, []);

  // Reset function
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
    });
    setPendingByItem({});
    persistingByItemRef.current = {};
    lastConfirmedRef.current = {};
    
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
    onItemsRefetched,
    reset,
  };
}