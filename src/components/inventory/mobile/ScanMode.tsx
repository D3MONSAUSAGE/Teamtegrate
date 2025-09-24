import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Minus, Camera, Flashlight, FlipHorizontal, Edit3 } from 'lucide-react';
import { ScannerOverlay } from '../ScannerOverlay';
import { ItemPickerSheet } from './ItemPickerSheet';
import { InventoryCountItem, InventoryItem } from '@/contexts/inventory/types';
import { useToast } from '@/hooks/use-toast';
import { inventoryCountsApi } from '@/contexts/inventory/api';
import { useIsMobile } from '@/hooks/use-mobile';

interface ScanModeProps {
  countId: string;
  countItems: InventoryCountItem[];
  items: InventoryItem[];
  onUpdateCount: (countId: string, itemId: string, actualQuantity: number, notes?: string) => Promise<void>;
  onComplete?: () => void;
}

export const ScanMode: React.FC<ScanModeProps> = ({
  countId,
  countItems,
  items,
  onUpdateCount,
  onComplete
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedCountItem, setSelectedCountItem] = useState<InventoryCountItem | null>(null);
  const [startQty, setStartQty] = useState<number>(0);
  const [qtyPerScan, setQtyPerScan] = useState<number>(1);
  const [sessionIncrements, setSessionIncrements] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualQty, setManualQty] = useState<string>('');
  
  const sessionIncrementsRef = useRef<number>(0);
  const lastUpdateRef = useRef<Promise<void> | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find count item for selected item
  useEffect(() => {
    if (selectedItem) {
      const countItem = countItems.find(ci => ci.item_id === selectedItem.id);
      setSelectedCountItem(countItem || null);
      setStartQty(countItem?.actual_quantity || 0);
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

  // Debounced update function
  const debouncedPersist = useCallback(async (delta: number) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (selectedItem && selectedCountItem) {
        try {
          const newActualQty = (selectedCountItem.actual_quantity || 0) + sessionIncrementsRef.current;
          await onUpdateCount(countId, selectedItem.id, newActualQty);
        } catch (error) {
          console.error('Failed to persist count update:', error);
          toast({
            title: 'Save failed',
            description: 'Tap to retry saving your count',
            variant: 'destructive',
            action: <Button variant="outline" size="sm" onClick={() => debouncedPersist(0)}>Retry</Button>
          });
        }
      }
    }, 300);
  }, [selectedItem, selectedCountItem, countId, onUpdateCount, toast]);

  const handleScanDetected = useCallback((code: string) => {
    if (!selectedItem) return;
    
    // Check if barcode matches (if item has barcode)
    if (selectedItem.barcode && code !== selectedItem.barcode) {
      return; // Ignore mismatched barcodes silently
    }

    // Increment session counter
    sessionIncrementsRef.current += qtyPerScan;
    setSessionIncrements(sessionIncrementsRef.current);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(35);
    }

    // Debounced persist
    debouncedPersist(qtyPerScan);
  }, [selectedItem, qtyPerScan, debouncedPersist]);

  const handleSetStartQty = () => {
    if (selectedItem && selectedCountItem) {
      onUpdateCount(countId, selectedItem.id, startQty);
      setSessionIncrements(0);
      sessionIncrementsRef.current = 0;
    }
  };

  const handleManualEntry = () => {
    if (manualQty && selectedItem) {
      const qty = parseInt(manualQty, 10);
      if (!isNaN(qty)) {
        onUpdateCount(countId, selectedItem.id, qty);
        setManualQty('');
        setShowManualEntry(false);
        setSessionIncrements(0);
        sessionIncrementsRef.current = 0;
      }
    }
  };

  const handleQtyPerScanChange = (increment: boolean) => {
    if (increment) {
      setQtyPerScan(prev => Math.min(prev + 1, 10));
    } else {
      setQtyPerScan(prev => Math.max(prev - 1, 1));
    }
  };

  // Calculate progress
  const countedItems = countItems.filter(ci => (ci.actual_quantity !== null && ci.actual_quantity !== undefined));
  const totalItems = countItems.length;
  const progressPercentage = totalItems > 0 ? (countedItems.length / totalItems) * 100 : 0;

  // Get min/max thresholds
  const minThreshold = selectedCountItem?.template_minimum_quantity ?? selectedItem?.minimum_threshold;
  const maxThreshold = selectedCountItem?.template_maximum_quantity ?? selectedItem?.maximum_threshold;
  const inStock = selectedItem?.current_stock;
  const actualQty = (selectedCountItem?.actual_quantity || 0) + sessionIncrements;

  // Status badge
  const getStatus = () => {
    if (actualQty > 0) return { label: 'Counted', variant: 'default' as const };
    return { label: 'Pending', variant: 'secondary' as const };
  };
  const status = getStatus();

  if (!isMobile) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Scan Mode is only available on mobile devices.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      {/* Sticky Item Summary */}
      <Card className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-2">
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
                  <span className="text-muted-foreground">In-Stock:</span> {inStock ?? '—'}
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
            
            <div className="flex flex-col gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowItemPicker(true)}
                className="min-h-[44px]"
              >
                Select Item
              </Button>
              <div className="flex gap-1">
                <Input
                  type="number"
                  value={startQty}
                  onChange={(e) => setStartQty(parseInt(e.target.value) || 0)}
                  className="w-16 h-8 text-xs"
                  placeholder="Start"
                />
                <Button size="sm" variant="ghost" onClick={handleSetStartQty} className="h-8 px-2">
                  Set
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Row */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{countedItems.length} of {totalItems} items counted</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Scan Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setIsScanning(!isScanning)}
                className="flex-1 min-h-[48px]"
                variant={isScanning ? "destructive" : "default"}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isScanning ? 'Stop Scanning' : 'Start Scanning'}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] px-3"
                disabled
              >
                <Flashlight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] px-3"
                disabled
              >
                <FlipHorizontal className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManualEntry(true)}
                className="flex-1 min-h-[44px]"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
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
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry Dialog */}
      {showManualEntry && (
        <Card className="fixed inset-x-4 bottom-4 z-50 bg-background border-2">
          <CardContent className="p-4">
            <div className="space-y-3">
              <h4 className="font-medium">Manual Entry for {selectedItem?.name}</h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={manualQty}
                  onChange={(e) => setManualQty(e.target.value)}
                  placeholder="Enter quantity"
                  className="flex-1 min-h-[44px]"
                  autoFocus
                />
                <Button onClick={handleManualEntry} className="min-h-[44px]">
                  Set
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowManualEntry(false)}
                className="w-full min-h-[44px]"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanner Overlay */}
      <ScannerOverlay
        open={isScanning}
        onClose={() => setIsScanning(false)}
        onBarcode={handleScanDetected}
        continuous={true}
        instructions={`Scanning for ${selectedItem?.name || 'selected item'}`}
      />

      {/* Item Picker Sheet */}
      <ItemPickerSheet
        open={showItemPicker}
        onClose={() => setShowItemPicker(false)}
        items={items}
        countItems={countItems}
        onItemSelect={(item) => {
          setSelectedItem(item);
          setShowItemPicker(false);
        }}
      />
    </div>
  );
};