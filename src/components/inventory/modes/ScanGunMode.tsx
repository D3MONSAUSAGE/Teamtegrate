import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Scan, Package, Zap, Wifi, WifiOff } from 'lucide-react';
import { useScanGun } from '@/hooks/useScanGun';
import { ScanItemPicker } from '../ScanItemPicker';
import { InventoryCountItem, InventoryItem } from '@/contexts/inventory/types';
import { useToast } from '@/hooks/use-toast';
import { inventoryCountsApi, inventoryItemsApi } from '@/contexts/inventory/api';
import { validateUUID } from '@/utils/uuidValidation';
import { useNetworkMonitoring } from '@/contexts/UnifiedDataContext/useNetworkMonitoring';

interface ScanGunModeProps {
  countId: string;
  countItems: InventoryCountItem[];
  items: InventoryItem[];
  onUpdateCount: (countId: string, itemId: string, actualQuantity: number, notes?: string) => Promise<void>;
  onComplete?: () => void;
  onRefetchCountItems?: () => Promise<void>;
}

export const ScanGunMode: React.FC<ScanGunModeProps> = ({
  countId,
  countItems,
  items,
  onUpdateCount,
  onComplete,
  onRefetchCountItems
}) => {
  const { toast } = useToast();
  const { networkStatus } = useNetworkMonitoring();
  
  // State
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedCountItem, setSelectedCountItem] = useState<InventoryCountItem | null>(null);
  const [qtyPerScan, setQtyPerScan] = useState<number>(1);
  const [sessionIncrements, setSessionIncrements] = useState<number>(0);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [attachFirstScan, setAttachFirstScan] = useState<boolean>(true);
  const [autoSelectByBarcode, setAutoSelectByBarcode] = useState<boolean>(true);
  const [scannerSuffix, setScannerSuffix] = useState<'enter' | 'tab' | 'both'>('both');
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  
  // Refs for debouncing and retry logic
  const sessionIncrementsRef = useRef<number>(0);
  const sessionIncrementsBackupRef = useRef<number>(0); // Backup for recovery
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScanRef = useRef<string>('');
  const lastAttachedRef = useRef<string | null>(null);
  const refetchCompletedRef = useRef<boolean>(true);

  // Find count item for selected item
  useEffect(() => {
    if (selectedItem) {
      const countItem = countItems.find(ci => ci.item_id === selectedItem.id);
      setSelectedCountItem(countItem || null);
    } else {
      setSelectedCountItem(null);
    }
  }, [selectedItem, countItems]);

  // Auto-select first item if none selected
  useEffect(() => {
    if (!selectedItem && items.length > 0) {
      setSelectedItem(items[0]);
    }
  }, [selectedItem, items]);

  // Reset session increments when switching items
  useEffect(() => {
    setSessionIncrements(0);
    sessionIncrementsRef.current = 0;
    sessionIncrementsBackupRef.current = 0;
    refetchCompletedRef.current = true;
  }, [selectedItem]);

  // Retry logic with exponential backoff
  const retryWithBackoff = async (
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
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  // Enhanced debounced persist function with validation, retry logic and proper timing
  const debouncedPersist = useCallback(async (delta: number) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (selectedItem && selectedCountItem) {
        // Input validation
        const validatedCountId = validateUUID(countId);
        const validatedItemId = validateUUID(selectedItem.id);
        
        if (!validatedCountId || !validatedItemId) {
          console.error('Invalid UUID detected:', { countId: validatedCountId, itemId: validatedItemId });
          toast({
            title: 'Invalid data',
            description: 'Invalid item or count identifier',
            variant: 'destructive',
          });
          // Restore backup increments on validation failure
          const backupIncrements = sessionIncrementsBackupRef.current;
          setSessionIncrements(backupIncrements);
          sessionIncrementsRef.current = backupIncrements;
          return;
        }

        // Store backup before attempting to persist
        sessionIncrementsBackupRef.current = sessionIncrementsRef.current;
        setIsRetrying(true);
        refetchCompletedRef.current = false;

        try {
          const currentActual = selectedCountItem.actual_quantity || 0;
          const newActualQty = currentActual + sessionIncrementsRef.current;
          console.log('[BUMP_REQUEST] {countId, countItemId, delta}', { countId, countItemId: selectedCountItem.id, delta: sessionIncrementsRef.current });
          console.log('SCANGUN_PERSIST:', { 
            itemId: selectedItem.id, 
            currentActual, 
            sessionIncrements: sessionIncrementsRef.current, 
            newActualQty 
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
          
          console.log('[BUMP_RESPONSE] success');
          
          // Refetch count items to get updated server data
          if (onRefetchCountItems) {
            await onRefetchCountItems();
            refetchCompletedRef.current = true;
          }
          
          // Only reset session increments after successful persist AND refetch completion
          if (refetchCompletedRef.current) {
            setSessionIncrements(0);
            sessionIncrementsRef.current = 0;
            sessionIncrementsBackupRef.current = 0;
          }
          
        } catch (error) {
          console.log('[BUMP_RESPONSE] error', error);
          console.error('SCANGUN_PERSIST_ERROR:', error);
          
          // Keep optimistic update visible - don't reset to zero
          // Restore from backup instead
          const backupIncrements = sessionIncrementsBackupRef.current;
          setSessionIncrements(backupIncrements);
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
          setIsRetrying(false);
        }
      }
    }, 350);
  }, [selectedItem, selectedCountItem, countId, toast, networkStatus, onRefetchCountItems, retryWithBackoff]);

  // Handle scan detection
  const handleScanDetected = useCallback(async (code: string) => {
    console.log('[SCAN] code=', code, 'suffix=enter/tab');
    console.log('SCANGUN_SCAN_DETECTED:', { code, selectedItem: selectedItem?.name });
    
    if (!selectedItem) {
      toast({
        title: 'No item selected',
        description: 'Please select an item first',
        variant: 'destructive',
      });
      return;
    }
    
    lastScanRef.current = code;

    // Auto-select by barcode if enabled
    if (autoSelectByBarcode) {
      const foundItem = items.find(item => item.barcode === code);
      if (foundItem && foundItem.id !== selectedItem.id) {
        console.log('SCANGUN_AUTO_SELECT:', { foundItem: foundItem.name });
        setSelectedItem(foundItem);
        // Will increment on next scan detection after item switches
        return;
      }
      if (!foundItem) {
        toast({
          title: 'Item not in this count',
          description: `Barcode ${code} not found in current count`,
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Check barcode match for selected item
    if (selectedItem.barcode) {
      if (code !== selectedItem.barcode) {
        console.log('SCANGUN_BARCODE_MISMATCH:', { scanned: code, expected: selectedItem.barcode });
        toast({
          title: 'Not this item',
          description: `Scanned ${code}, expected ${selectedItem.barcode}`,
          variant: 'destructive',
        });
        return;
      }
    } else {
      // Item has no barcode - handle attachment
      if (attachFirstScan && selectedItem && !selectedItem.barcode) {
        try {
          const trimmed = code.trim();
          if (!trimmed) return; // nothing to attach

          // prevent double-attach on the same scan burst
          if (lastAttachedRef.current === trimmed) return;
          lastAttachedRef.current = trimmed;
          setTimeout(() => (lastAttachedRef.current = null), 1000);

          await inventoryItemsApi.update(selectedItem.id, { barcode: trimmed });

          // Optimistic UI
          setSelectedItem(prev => (prev ? { ...prev, barcode: trimmed } : prev));

          toast({ title: 'Barcode attached', description: `${trimmed} → ${selectedItem.name}` });
          // IMPORTANT: do NOT return; we want this same scan to continue
          // into the existing increment/persist path so it counts too.
        } catch (e: any) {
          toast({
            title: 'Failed to attach barcode',
            description: e?.message ?? 'Could not attach barcode',
            variant: 'destructive',
          });
          return; // abort counting for this scan on error
        }
      }
    }

    // Accept scan - increment optimistically
    sessionIncrementsRef.current += qtyPerScan;
    setSessionIncrements(sessionIncrementsRef.current);
    
    console.log('[MATCH] countItemId=', selectedCountItem?.id || 'NO_COUNT_ITEM');
    console.log('[INCREMENT] key=', selectedItem.id, 'delta=', qtyPerScan);
    console.log('SCANGUN_INCREMENT:', { 
      qtyPerScan, 
      newSessionTotal: sessionIncrementsRef.current 
    });
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Show feedback toast
    const currentActual = selectedCountItem?.actual_quantity || 0;
    const newInStock = currentActual + sessionIncrementsRef.current;
    toast({
      title: `+${qtyPerScan} scanned`,
      description: `${selectedItem.name} • In-Stock: ${newInStock}`,
      duration: 2000,
    });
    
    // Debounced persist
    debouncedPersist(qtyPerScan);
  }, [selectedItem, selectedCountItem, qtyPerScan, attachFirstScan, autoSelectByBarcode, items, countId, toast, debouncedPersist]);

  // Initialize scan gun
  const { isListening, scannerConnected, reset } = useScanGun({
    onScan: handleScanDetected,
    onStart: () => console.log('SCANGUN_START'),
    onStop: () => console.log('SCANGUN_STOP'),
    enabled: true,
  });

  const handleQtyPerScanChange = (increment: boolean) => {
    if (increment) {
      setQtyPerScan(prev => Math.min(prev + 1, 10));
    } else {
      setQtyPerScan(prev => Math.max(prev - 1, 1));
    }
  };

  // Calculate progress and status
  const countedItems = countItems.filter(ci => ci.actual_quantity !== null).length;
  const totalItems = countItems.length;
  const progress = totalItems > 0 ? (countedItems / totalItems) * 100 : 0;
  
  const actualQty = (selectedCountItem?.actual_quantity || 0) + sessionIncrements;
  const inStock = selectedCountItem?.in_stock_quantity ?? selectedItem?.current_stock ?? 0;
  
  // Debug render
  console.log('[RENDER]', {
    countItemId: selectedCountItem?.id,
    serverActual: selectedCountItem?.actual_quantity,
    sessionIncrements,
    displayActual: actualQty
  });
  const minThreshold = selectedCountItem?.template_minimum_quantity ?? selectedItem?.minimum_threshold;
  const maxThreshold = selectedCountItem?.template_maximum_quantity ?? selectedItem?.maximum_threshold;
  
  const getStatus = () => {
    if (actualQty > 0) return { label: 'Counted', variant: 'default' as const };
    return { label: 'Pending', variant: 'secondary' as const };
  };
  const status = getStatus();

  return (
    <div className="flex flex-col space-y-4">
      {/* Hidden input to maintain focus */}
      <input
        className="scangun-input opacity-0 absolute -z-10"
        type="text"
        autoFocus
        style={{ width: 1, height: 1 }}
        onChange={() => {}} // Prevent warnings
      />

      {/* Sticky Item Summary */}
      <Card className="border-2 shadow-lg">
        <CardContent className="p-0">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 border-b">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg leading-tight truncate text-foreground">
                  {selectedItem?.name || 'No item selected'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">SKU:</span>
                  <span className="text-sm font-medium">{selectedItem?.sku || ''}</span>
                  {selectedItem?.barcode && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      <Scan className="h-3 w-3 mr-1" />
                      {selectedItem.barcode}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quantities Grid */}
          <div className="p-4 bg-muted/30">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-background rounded-lg shadow-sm border">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">MIN</div>
                <div className="text-xl font-bold text-foreground mt-2">{minThreshold ?? '—'}</div>
              </div>
              <div className="text-center p-4 bg-background rounded-lg shadow-sm border">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">MAX</div>
                <div className="text-xl font-bold text-foreground mt-2">{maxThreshold ?? '—'}</div>
              </div>
              <div className="text-center p-4 bg-background rounded-lg shadow-sm border">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">EXPECTED</div>
                <div className="text-xl font-bold text-foreground mt-2">{inStock}</div>
              </div>
            </div>
          </div>

          {/* Bottom Section with Actual Count and Status */}
          <div className="p-4 flex items-center justify-between">
            {/* Status Badge on Left */}
            <Badge 
              variant={status.variant} 
              className={`${status.variant === 'default' ? 'bg-primary/10 text-primary border-primary/20' : ''} px-3 py-1`}
            >
              {status.label}
            </Badge>
            
            {/* Actual Count in Center */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ACTUAL</span>
              <span className="text-3xl font-bold text-primary">{actualQty}</span>
              {sessionIncrements > 0 && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold animate-pulse text-xs mt-1">
                  +{sessionIncrements}
                </Badge>
              )}
            </div>
            
            {/* Select Button on Right */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowItemPicker(true)}
              className="min-h-[44px] px-3 bg-background/80 hover:bg-background"
            >
              <Package className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Select</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{countedItems} of {totalItems} items counted</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Scan Dock */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Scanner Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                scannerConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                'bg-muted text-muted-foreground'
              }`}>
                <Scan className="h-4 w-4" />
                <span className="text-sm">
                  {scannerConnected ? 'Scanner connected' : 'Waiting for scanner...'}
                </span>
              </div>
              
              {/* Network Status */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                networkStatus === 'healthy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                networkStatus === 'degraded' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {networkStatus === 'offline' ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                <span className="text-sm">
                  {networkStatus === 'healthy' ? 'Online' : 
                   networkStatus === 'degraded' ? 'Slow' : 'Offline'}
                </span>
              </div>
              
              {/* Retry Status */}
              {isRetrying && (
                <Badge variant="outline" className="text-xs">
                  Saving...
                </Badge>
              )}
              
              {lastScanRef.current && (
                <Badge variant="outline" className="text-xs">
                  Last: {lastScanRef.current}
                </Badge>
              )}
            </div>
            
            {/* Qty per scan stepper */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQtyPerScanChange(false)}
                disabled={qtyPerScan <= 1}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-sm px-3">Qty per scan: {qtyPerScan}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQtyPerScanChange(true)}
                disabled={qtyPerScan >= 10}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Settings */}
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="attach-barcode" className="text-sm">
                  Attach first scan as barcode when item has none
                </Label>
                <Switch
                  id="attach-barcode"
                  checked={attachFirstScan}
                  onCheckedChange={setAttachFirstScan}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-select" className="text-sm">
                  Auto-select item by scanned barcode
                </Label>
                <Switch
                  id="auto-select"
                  checked={autoSelectByBarcode}
                  onCheckedChange={setAutoSelectByBarcode}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="scanner-suffix" className="text-sm">
                  Scanner suffix
                </Label>
                <Select value={scannerSuffix} onValueChange={(value: 'enter' | 'tab' | 'both') => setScannerSuffix(value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enter">Enter</SelectItem>
                    <SelectItem value="tab">Tab</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Picker */}
      <ScanItemPicker
        open={showItemPicker}
        onClose={() => setShowItemPicker(false)}
        items={items}
        countItems={countItems}
        selectedItemId={selectedItem?.id}
        onItemSelect={(item) => {
          setSelectedItem(item);
          setShowItemPicker(false);
        }}
      />
    </div>
  );
};