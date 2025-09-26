import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Plus, Minus, Camera, Package, Settings, ChevronRight, Scan } from 'lucide-react';
import { ScannerOverlay } from '../ScannerOverlay';
import { ScanItemPicker } from '../ScanItemPicker';
import { InventoryCountItem, InventoryItem } from '@/contexts/inventory/types';
import { useScanEngine, ScanEngineSettings } from '@/hooks/useScanEngine';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileScanModeProps {
  countId: string;
  countItems: InventoryCountItem[];
  items: InventoryItem[];
  onUpdateCount: (countId: string, itemId: string, actualQuantity: number, notes?: string) => Promise<void>;
  onComplete?: () => void;
}

export const MobileScanMode: React.FC<MobileScanModeProps> = ({
  countId,
  countItems,
  items,
  onUpdateCount,
  onComplete
}) => {
  const isMobile = useIsMobile();
  
  // Settings state
  const [attachFirstScan, setAttachFirstScan] = useState<boolean>(true);
  const [autoSelectByBarcode, setAutoSelectByBarcode] = useState<boolean>(true);
  const [autoSwitchOnMatch, setAutoSwitchOnMatch] = useState<boolean>(true);
  const [qtyPerScan, setQtyPerScan] = useState<number>(1);
  
  // UI state
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [scanLog, setScanLog] = useState<Array<{ type: 'success' | 'error' | 'attach'; message: string; time: Date }>>([]);

  // Filter items to only those in this count (template-limited)
  const countableItems = items.filter(item => 
    countItems.some(ci => ci.item_id === item.id)
  );

  // Scan engine settings
  const scanEngineSettings: ScanEngineSettings = {
    countId,
    attachFirstScan,
    autoSelectByBarcode,
    autoSwitchOnMatch,
    qtyPerScan,
    dedupeMs: 600, // Slightly longer than scan-gun for mobile touch delays
  };

  // Initialize scan engine
  const { state: scanState, dispatch: scanDispatch } = useScanEngine(
    scanEngineSettings,
    countableItems,
    countItems
  );

  const selectedItem = countableItems.find(item => item.id === scanState.currentItemId);
  const selectedCountItem = countItems.find(ci => ci.item_id === scanState.currentItemId);

  // Auto-select first item if none selected
  useEffect(() => {
    if (!scanState.currentItemId && countableItems.length > 0) {
      scanDispatch({ type: 'ITEM_SELECTED', itemId: countableItems[0].id });
    }
  }, [scanState.currentItemId, countableItems, scanDispatch]);

  // Handle barcode scan
  const handleScanDetected = useCallback((code: string) => {
    scanDispatch({ type: 'SCAN_DETECTED', code });
    
    // Add to scan log
    setScanLog(prev => [
      { type: 'success', message: `Scanned: ${code}`, time: new Date() },
      ...prev.slice(0, 2) // Keep only last 3 entries
    ]);
  }, [scanDispatch]);

  // Handle item selection
  const handleItemSelect = useCallback((item: InventoryItem) => {
    scanDispatch({ type: 'ITEM_SELECTED', itemId: item.id });
    setShowItemPicker(false);
  }, [scanDispatch]);

  // Qty per scan controls
  const handleQtyPerScanChange = (increment: boolean) => {
    if (increment) {
      setQtyPerScan(prev => Math.min(prev + 1, 10));
    } else {
      setQtyPerScan(prev => Math.max(prev - 1, 1));
    }
  };

  // Find next uncounted item for auto-advance
  const getNextUnCountedItem = (): InventoryItem | null => {
    if (!selectedItem) return null;
    
    const currentIndex = countableItems.findIndex(item => item.id === selectedItem.id);
    for (let i = currentIndex + 1; i < countableItems.length; i++) {
      const item = countableItems[i];
      const countItem = countItems.find(ci => ci.item_id === item.id);
      if (!countItem || countItem.actual_quantity === null) {
        return item;
      }
    }
    return null;
  };

  // Auto-advance to next item
  const handleNextItem = () => {
    const nextItem = getNextUnCountedItem();
    if (nextItem) {
      handleItemSelect(nextItem);
    }
  };

  // Calculate progress and status
  const countedItems = countItems.filter(ci => ci.actual_quantity !== null).length;
  const totalItems = countItems.length;
  const progress = totalItems > 0 ? (countedItems / totalItems) * 100 : 0;
  
  const actualQty = (selectedCountItem?.actual_quantity || 0) + scanState.sessionIncrements;
  const inStock = selectedCountItem?.in_stock_quantity ?? selectedItem?.current_stock ?? 0;
  const minThreshold = selectedCountItem?.template_minimum_quantity ?? selectedItem?.minimum_threshold;
  const maxThreshold = selectedCountItem?.template_maximum_quantity ?? selectedItem?.maximum_threshold;
  
  const getStatus = () => {
    if (actualQty > 0) return { label: 'Counted', variant: 'default' as const };
    return { label: 'Pending', variant: 'secondary' as const };
  };
  const status = getStatus();


  return (
    <div className="flex flex-col space-y-4 p-4 pb-20">
      {/* Sticky Item Summary */}
      <Card className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-2 shadow-lg">
        <CardContent className="p-0">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 border-b">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg leading-tight truncate text-foreground">
                  {selectedItem?.name || 'No item selected'}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm text-muted-foreground">SKU:</span>
                  <span className="text-sm font-medium">{selectedItem?.sku || ''}</span>
                  {selectedItem?.barcode && (
                    <Badge variant="secondary" className="text-xs ml-2">
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
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">EXP</div>
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
              {scanState.sessionIncrements > 0 && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold animate-pulse text-xs mt-1">
                  +{scanState.sessionIncrements}
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

      {/* Scan Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Main scan button */}
            <Button
              onClick={() => setIsScanning(!isScanning)}
              className="w-full min-h-[56px] text-lg"
              variant={isScanning ? "destructive" : "default"}
              disabled={scanState.isProcessing}
            >
              <Camera className="h-5 w-5 mr-3" />
              {isScanning ? 'Stop Scanning' : 'Start Scanning'}
            </Button>

            {/* Qty per scan stepper */}
            <div className="flex items-center justify-center gap-4 p-2 bg-muted rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQtyPerScanChange(false)}
                disabled={qtyPerScan <= 1}
                className="h-10 w-10 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <div className="font-semibold">{qtyPerScan}</div>
                <div className="text-xs text-muted-foreground">per scan</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQtyPerScanChange(true)}
                disabled={qtyPerScan >= 10}
                className="h-10 w-10 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Log */}
      {scanLog.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 text-sm">Recent Scans</h4>
            <div className="space-y-1">
              {scanLog.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className={`flex items-center gap-1 ${
                    entry.type === 'success' ? 'text-green-600' : 
                    entry.type === 'error' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {entry.type === 'success' ? '✓' : entry.type === 'error' ? '✕' : '📎'}
                    {entry.message}
                  </span>
                  <span className="text-muted-foreground">
                    {entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Item Button */}
      {getNextUnCountedItem() && (
        <Button
          onClick={handleNextItem}
          variant="outline"
          className="w-full min-h-[48px]"
        >
          Next Item: {getNextUnCountedItem()?.name}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      )}

      {/* Settings Sheet */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full min-h-[48px]">
            <Settings className="h-4 w-4 mr-2" />
            Scan Settings
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Scan Settings</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-4">
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
              <Label htmlFor="auto-switch" className="text-sm">
                Auto-switch to different items (when barcode matches)
              </Label>
              <Switch
                id="auto-switch"
                checked={autoSwitchOnMatch}
                onCheckedChange={setAutoSwitchOnMatch}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Scanner Overlay */}
      <ScannerOverlay
        open={isScanning}
        onClose={() => setIsScanning(false)}
        onBarcode={handleScanDetected}
        continuous={true}
        instructions={`Scanning for ${selectedItem?.name || 'selected item'}`}
        contextItem={selectedItem ? {
          name: selectedItem.name,
          scannedCount: countItems.find(ci => ci.item_id === selectedItem.id)?.actual_quantity || 0
        } : undefined}
      />

      {/* Item Picker */}
      <ScanItemPicker
        open={showItemPicker}
        onClose={() => setShowItemPicker(false)}
        items={countableItems}
        countItems={countItems}
        selectedItemId={selectedItem?.id}
        onItemSelect={handleItemSelect}
      />
    </div>
  );
};