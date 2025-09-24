import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { InventoryCountItem, InventoryItem, InventoryCategory, InventoryUnit } from '@/contexts/inventory/types';
import { 
  Package, 
  CheckCircle, 
  Scan, 
  Minus, 
  Plus,
  ArrowLeft,
  ArrowRight,
  Hash
} from 'lucide-react';
import { ScannerOverlay } from './ScannerOverlay';
import { CreateItemDialog } from './CreateItemDialog';
import { inventoryItemsApi } from '@/contexts/inventory/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StreamlinedMobileCountProps {
  countItems: InventoryCountItem[];
  items: InventoryItem[];
  categories: InventoryCategory[];
  units: InventoryUnit[];
  activeCountId?: string;
  onUpdateCount: (itemId: string, actualQuantity: number) => void;
  onItemCreated: (item: InventoryItem) => void;
  onCompleteCount: () => void;
  progress: number;
  completedItems: number;
  totalItems: number;
}

export const StreamlinedMobileCount: React.FC<StreamlinedMobileCountProps> = ({
  countItems,
  items,
  categories,
  units,
  activeCountId,
  onUpdateCount,
  onItemCreated,
  onCompleteCount,
  progress,
  completedItems,
  totalItems,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState<string>('');

  const currentItem = items[currentIndex];
  const countItem = countItems.find(ci => ci.item_id === currentItem?.id);
  const inStockQty = countItem?.in_stock_quantity || currentItem?.current_stock || 0;
  const actualQty = countItem?.actual_quantity;

  const handleQuantityUpdate = (quantity: number) => {
    if (!currentItem) return;
    onUpdateCount(currentItem.id, quantity);
    setInputValue('');
    
    // Auto-advance to next item
    setTimeout(() => {
      if (currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }, 500);
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setInputValue('');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setInputValue('');
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      // Look up item by barcode
      const item = await inventoryItemsApi.getByBarcode(barcode);
      
      if (!item) {
        // Unknown barcode - show create dialog
        setUnknownBarcode(barcode);
        setIsScanning(false);
        setShowCreateDialog(true);
        toast.error(`Unknown barcode: ${barcode}`);
        return;
      }

      // Find the item in our current items and navigate to it
      const itemIndex = items.findIndex(i => i.id === item.id);
      if (itemIndex >= 0) {
        setCurrentIndex(itemIndex);
        // Auto-fill with scanned quantity (1)
        handleQuantityUpdate(1);
        setIsScanning(false);
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        toast.success(`Scanned: ${item.name}`);
      } else {
        toast.error('Item not in current count');
        setIsScanning(false);
      }
      
    } catch (error) {
      console.error('Barcode lookup failed:', error);
      toast.error('Failed to process barcode scan');
      setIsScanning(false);
    }
  };

  const handleScanBarcode = () => {
    setIsScanning(true);
  };

  const handleItemCreated = (newItem: InventoryItem) => {
    onItemCreated(newItem);
    setShowCreateDialog(false);
    setUnknownBarcode('');
  };

  const nextItem = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevItem = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentItem) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">No items to count</p>
      </div>
    );
  }

  const isCounted = actualQty !== null && actualQty !== undefined;

  return (
    <>
      <ScannerOverlay
        open={isScanning}
        onClose={() => setIsScanning(false)}
        onBarcode={handleBarcodeScanned}
        instructions={`Scan: ${currentItem.name}`}
      />
      
      <CreateItemDialog
        open={showCreateDialog}
        onClose={() => {setShowCreateDialog(false); setUnknownBarcode('');}}
        onItemCreated={handleItemCreated}
        categories={categories}
        units={units}
        prefilledBarcode={unknownBarcode}
      />
      
      <div className="min-h-screen bg-background">
        {/* Fixed Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">
              {currentIndex + 1}/{totalItems}
            </div>
            <Badge variant={isCounted ? 'default' : 'secondary'} className="px-3 py-1">
              {isCounted ? 'Counted' : 'Pending'}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content */}
        <div className="p-4 pb-24 space-y-6">
          {/* Item Info */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div>
                  <h2 className="text-xl font-bold mb-2">{currentItem.name}</h2>
                  {currentItem.sku && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Hash className="h-4 w-4" />
                      {currentItem.sku}
                    </div>
                  )}
                </div>

                {/* Expected vs Actual - Large Display */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-6 bg-muted rounded-xl">
                    <div className="text-3xl font-bold text-muted-foreground">{inStockQty}</div>
                    <div className="text-sm font-medium">Expected</div>
                  </div>
                  <div className="text-center p-6 bg-primary/10 rounded-xl border-2 border-primary/20">
                    <div className="text-3xl font-bold text-primary">
                      {isCounted ? actualQty : '—'}
                    </div>
                    <div className="text-sm font-medium text-primary">Actual</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Count Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Quick Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleQuantityUpdate(Math.max(0, inStockQty - 1))}
                    className="h-14 text-lg"
                  >
                    <Minus className="h-5 w-5 mr-1" />
                    {inStockQty - 1}
                  </Button>
                  <Button
                    variant={isCounted && actualQty === inStockQty ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleQuantityUpdate(inStockQty)}
                    className="h-14 text-lg"
                  >
                    <CheckCircle className="h-5 w-5 mr-1" />
                    {inStockQty}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleQuantityUpdate(inStockQty + 1)}
                    className="h-14 text-lg"
                  >
                    <Plus className="h-5 w-5 mr-1" />
                    {inStockQty + 1}
                  </Button>
                </div>

                {/* Manual Input */}
                <div className="flex gap-3">
                  <Input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter count"
                    className="text-lg h-14 text-center"
                    step="0.01"
                    min="0"
                  />
                  <Button
                    onClick={() => {
                      const value = parseFloat(inputValue);
                      if (!isNaN(value) && value >= 0) {
                        handleQuantityUpdate(value);
                      }
                    }}
                    disabled={!inputValue || isNaN(parseFloat(inputValue)) || parseFloat(inputValue) < 0}
                    size="lg"
                    className="h-14 px-8"
                  >
                    Set
                  </Button>
                </div>

                {/* Scan Button */}
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full h-14 text-lg"
                  onClick={handleScanBarcode}
                  disabled={isScanning}
                >
                  <Scan className={cn("h-5 w-5 mr-2", isScanning && "animate-pulse")} />
                  {isScanning ? 'Scanning...' : 'Scan Barcode'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fixed Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="flex gap-4 max-w-lg mx-auto">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              size="lg"
              className="flex-1 h-12"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentIndex === items.length - 1 ? (
              <Button
                onClick={onCompleteCount}
                disabled={completedItems === 0}
                size="lg"
                className="flex-1 h-12"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                size="lg"
                className="flex-1 h-12"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};