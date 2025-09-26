import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Scan, Package, Zap } from 'lucide-react';
import { useScanGun } from '@/hooks/useScanGun';
import { ScanItemPicker } from '../ScanItemPicker';
import { InventoryCountItem, InventoryItem } from '@/contexts/inventory/types';
import { useToast } from '@/hooks/use-toast';
import { inventoryCountsApi, inventoryItemsApi } from '@/contexts/inventory/api';

interface ScanGunModeProps {
  countId: string;
  countItems: InventoryCountItem[];
  items: InventoryItem[];
  onUpdateCount: (countId: string, itemId: string, actualQuantity: number, notes?: string) => Promise<void>;
  onComplete?: () => void;
}

export const ScanGunMode: React.FC<ScanGunModeProps> = ({
  countId,
  countItems,
  items,
  onUpdateCount,
  onComplete
}) => {
  const { toast } = useToast();
  
  // State
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedCountItem, setSelectedCountItem] = useState<InventoryCountItem | null>(null);
  const [qtyPerScan, setQtyPerScan] = useState<number>(1);
  const [sessionIncrements, setSessionIncrements] = useState<number>(0);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [attachFirstScan, setAttachFirstScan] = useState<boolean>(true);
  const [autoSelectByBarcode, setAutoSelectByBarcode] = useState<boolean>(false);
  const [scannerSuffix, setScannerSuffix] = useState<'enter' | 'tab' | 'both'>('enter');
  
  // Refs for debouncing
  const sessionIncrementsRef = useRef<number>(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScanRef = useRef<string>('');
  const lastAttachedRef = useRef<string | null>(null);

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
  }, [selectedItem]);

  // Debounced persist function
  const debouncedPersist = useCallback(async (delta: number) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (selectedItem && selectedCountItem) {
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
          
          await inventoryCountsApi.bumpActual(countId, selectedItem.id, sessionIncrementsRef.current);
          console.log('[BUMP_RESPONSE] success');
          
          // Reset session increments after successful persist
          setSessionIncrements(0);
          sessionIncrementsRef.current = 0;
          
        } catch (error) {
          console.log('[BUMP_RESPONSE] error', error);
          console.error('SCANGUN_PERSIST_ERROR:', error);
          
          // Rollback optimistic update
          setSessionIncrements(0);
          sessionIncrementsRef.current = 0;
          
          // Show friendly error
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (errorMessage.includes('row-level security') || errorMessage.includes('permission')) {
            toast({
              title: 'Permission denied (policy)',
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
    }, 350);
  }, [selectedItem, selectedCountItem, countId, toast]);

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
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {selectedItem?.name || 'No item selected'}
              </h3>
              <p className="text-sm text-muted-foreground">{selectedItem?.sku || 'No SKU'}</p>
              
              <div className="flex items-center gap-4 mt-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Min:</span> {minThreshold ?? '—'}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Max:</span> {maxThreshold ?? '—'}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">In-Stock:</span> {actualQty}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <div className="text-lg font-bold">
                  Actual: {actualQty}
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
                {sessionIncrements > 0 && (
                  <Badge variant="outline" className="text-xs">
                    +{sessionIncrements} this session
                  </Badge>
                )}
              </div>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowItemPicker(true)}
              className="min-h-[44px] ml-4"
            >
              Select Item
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
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                scannerConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                'bg-muted text-muted-foreground'
              }`}>
                <Scan className="h-4 w-4" />
                <span className="text-sm">
                  {scannerConnected ? 'Scanner connected' : 'Waiting for scanner...'}
                </span>
              </div>
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