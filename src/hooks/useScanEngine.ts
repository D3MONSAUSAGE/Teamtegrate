import { useState, useRef, useCallback, useEffect } from 'react';
import { InventoryItem, InventoryCountItem } from '@/contexts/inventory/types';
import { inventoryCountsApi, inventoryItemsApi } from '@/contexts/inventory/api';
import { useToast } from '@/hooks/use-toast';
import { validateUUID } from '@/utils/uuidValidation';
import { useNetworkMonitoring } from '@/contexts/UnifiedDataContext/useNetworkMonitoring';

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
  const { networkStatus } = useNetworkMonitoring();
  
  const [state, setState] = useState<ScanEngineState>({
    sessionIncrements: 0,
    isProcessing: false,
  });

  const sessionIncrementsRef = useRef<number>(0);
  const sessionIncrementsBackupRef = useRef<number>(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Add timeout ref for cleanup
  const lastAttachedRef = useRef<string | null>(null);
  const persistingRef = useRef<boolean>(false);
  const completionGuardRef = useRef<boolean>(false);
  const refetchCompletedRef = useRef<boolean>(true);

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

  // Retry logic with exponential backoff
  const retryWithBackoff = useCallback(async (
    operation: () => Promise<void>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<void> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await operation();
        return; // Success
      } catch (error) {
        if (attempt === maxRetries) {
          throw error; // Last attempt failed
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Scan engine attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, []);

  // Enhanced debounced persist function with validation, retry logic and proper timing
  const debouncedPersist = useCallback(async () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      const currentItem = getCurrentItem();
      const currentCountItem = getCurrentCountItem();
      
      // Prevent concurrent persistence operations or invalid data
      if (persistingRef.current || !currentItem || !currentCountItem || sessionIncrementsRef.current <= 0) {
        return;
      }
      
      // Input validation
      const validatedCountId = validateUUID(settings.countId);
      const validatedItemId = validateUUID(currentItem.id);
      
      if (!validatedCountId || !validatedItemId) {
        console.error('Invalid UUID detected in scan engine:', { countId: validatedCountId, itemId: validatedItemId });
        toast({
          title: 'Invalid data',
          description: 'Invalid item or count identifier',
          variant: 'destructive',
        });
        // Restore backup increments on validation failure
        const backupIncrements = sessionIncrementsBackupRef.current;
        setState(prev => ({ ...prev, sessionIncrements: backupIncrements }));
        sessionIncrementsRef.current = backupIncrements;
        return;
      }
      
      // Store backup before attempting to persist
      sessionIncrementsBackupRef.current = sessionIncrementsRef.current;
      persistingRef.current = true;
      refetchCompletedRef.current = false;
      
      try {
        console.log('SCAN_ENGINE_PERSIST:', { 
          itemId: currentItem.id, 
          sessionIncrements: sessionIncrementsRef.current 
        });

        // Show network status warning if degraded
        if (networkStatus === 'degraded') {
          toast({
            title: 'Slow connection',
            description: 'Save may take longer than usual',
            duration: 3000,
          });
        } else if (networkStatus === 'offline') {
          toast({
            title: 'No connection',
            description: 'Unable to save changes',
            variant: 'destructive',
            duration: 5000,
          });
          throw new Error('No network connection');
        }
        
        // Retry the bumpActual operation with exponential backoff
        await retryWithBackoff(async () => {
          await inventoryCountsApi.bumpActual(validatedCountId, validatedItemId, sessionIncrementsRef.current);
        });
        
        console.log('SCAN_ENGINE_PERSIST_SUCCESS: Waiting for data refresh...');
        
        // Clear any existing reset timeout
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
          resetTimeoutRef.current = null;
        }
        
        // Add delay to allow server data to refresh before clearing optimistic updates
        // This prevents the "fall back" issue where counts revert immediately
        resetTimeoutRef.current = setTimeout(() => {
          // Only reset if we're not currently persisting another change
          if (!persistingRef.current) {
            console.log('SCAN_ENGINE_RESET_INCREMENTS: Clearing session increments after successful persist');
            setState(prev => ({ ...prev, sessionIncrements: 0 }));
            sessionIncrementsRef.current = 0;
            sessionIncrementsBackupRef.current = 0;
            refetchCompletedRef.current = true;
          }
          resetTimeoutRef.current = null;
        }, 1500); // 1.5 second delay to allow data refresh
        
      } catch (error) {
        console.error('SCAN_ENGINE_PERSIST_ERROR:', error);
        
        // Keep optimistic update visible - restore from backup instead of zeroing
        const backupIncrements = sessionIncrementsBackupRef.current;
        setState(prev => ({ ...prev, sessionIncrements: backupIncrements }));
        sessionIncrementsRef.current = backupIncrements;
        
        // Show contextual error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (errorMessage.includes('invalid input syntax for type uuid')) {
          toast({
            title: 'Data error',
            description: 'Invalid item identifier. Please try selecting the item again.',
            variant: 'destructive',
          });
        } else if (errorMessage.includes('row-level security') || errorMessage.includes('permission')) {
          toast({
            title: 'Permission denied',
            description: 'You do not have permission to update this count',
            variant: 'destructive',
          });
        } else if (networkStatus === 'offline' || errorMessage.includes('connection')) {
          toast({
            title: 'Connection error',
            description: 'Changes saved locally. Will retry when connection is restored.',
            duration: 5000,
          });
        } else {
          toast({
            title: 'Save failed',
            description: `${errorMessage}. Changes preserved for retry.`,
            variant: 'destructive',
          });
        }
      } finally {
        persistingRef.current = false;
      }
    }, 350); // Same 350ms timeout as scan-gun
  }, [getCurrentItem, getCurrentCountItem, settings.countId, toast, networkStatus, retryWithBackoff]);

  // Main dispatch function
  const dispatch = useCallback(async (event: ScanEvent) => {
    if (state.isProcessing) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      switch (event.type) {
        case 'ITEM_SELECTED':
          if (event.itemId) {
            // Clear any pending reset timeouts when switching items
            if (resetTimeoutRef.current) {
              clearTimeout(resetTimeoutRef.current);
              resetTimeoutRef.current = null;
            }
            
            setState(prev => ({
              ...prev,
              currentItemId: event.itemId,
              sessionIncrements: 0,
            }));
            sessionIncrementsRef.current = 0;
            sessionIncrementsBackupRef.current = 0;
            refetchCompletedRef.current = true;
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
                sessionIncrementsBackupRef.current = 0;
                refetchCompletedRef.current = true;
                
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
            // Add validation for SET_QTY as well
            const validatedCountId = validateUUID(settings.countId);
            const validatedItemId = validateUUID(state.currentItemId);
            
            if (!validatedCountId || !validatedItemId) {
              toast({
                title: 'Invalid data',
                description: 'Invalid item or count identifier',
                variant: 'destructive',
              });
              break;
            }
            
            try {
              await inventoryCountsApi.setActual(validatedCountId, validatedItemId, event.qty);
              setState(prev => ({ ...prev, sessionIncrements: 0 }));
              sessionIncrementsRef.current = 0;
              sessionIncrementsBackupRef.current = 0;
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
    sessionIncrementsBackupRef.current = 0;
    refetchCompletedRef.current = true;
    persistingRef.current = false;
    completionGuardRef.current = false;
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    dispatch,
    reset,
  };
}
