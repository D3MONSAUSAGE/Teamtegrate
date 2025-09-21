import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { InventoryCountItem, InventoryItem } from '@/contexts/inventory/types';
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Camera, 
  Scan, 
  Minus, 
  Plus,
  ArrowLeft,
  ArrowRight,
  Target,
  TrendingUp
} from 'lucide-react';
import { StockStatusBadge } from './StockStatusBadge';
import { getStockStatus } from '@/utils/stockStatus';

interface MobileCountInterfaceProps {
  countItems: InventoryCountItem[];
  items: InventoryItem[];
  onUpdateCount: (itemId: string, actualQuantity: number) => void;
  onCompleteCount: () => void;
  progress: number;
  completedItems: number;
  totalItems: number;
}

export const MobileCountInterface: React.FC<MobileCountInterfaceProps> = ({
  countItems,
  items,
  onUpdateCount,
  onCompleteCount,
  progress,
  completedItems,
  totalItems,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');

  const currentItem = items[currentIndex];
  const countItem = countItems.find(ci => ci.item_id === currentItem?.id);
  const expectedQty = countItem?.expected_quantity || currentItem?.current_stock || 0;
  const actualQty = countItem?.actual_quantity;
  const variance = actualQty !== null && actualQty !== undefined 
    ? actualQty - expectedQty 
    : null;
  
  // Get stock status for current item
  const finalQuantity = actualQty !== null ? actualQty : expectedQty;
  const stockStatus = currentItem ? getStockStatus(finalQuantity, currentItem.minimum_threshold, currentItem.maximum_threshold) : null;

  const handleQuantityUpdate = (quantity: number) => {
    if (!currentItem) return;
    onUpdateCount(currentItem.id, quantity);
    setInputValue('');
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

  const handleQuickAdjust = (adjustment: number) => {
    const newValue = Math.max(0, expectedQty + adjustment);
    handleQuantityUpdate(newValue);
  };

  if (!currentItem) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">No items to count</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Item {currentIndex + 1} of {totalItems}
            </CardTitle>
            <Badge variant={actualQty !== null ? 'default' : 'secondary'}>
              {actualQty !== null ? 'Counted' : 'Pending'}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{completedItems} of {totalItems} completed</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Current Item */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {currentItem.name}
          </CardTitle>
          <CardDescription className="space-y-1">
            <div>SKU: {currentItem.sku || 'N/A'}</div>
            <div>Category: {currentItem.category?.name || 'N/A'}</div>
            {currentItem.location && <div>Location: {currentItem.location}</div>}
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-3 w-3" />
              Min: {currentItem.minimum_threshold ?? 'N/A'} • Max: {currentItem.maximum_threshold ?? 'N/A'}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Expected vs Actual */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{expectedQty}</div>
                <div className="text-sm text-muted-foreground">Expected</div>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold">
                  {actualQty !== null ? actualQty : '—'}
                </div>
                <div className="text-sm text-muted-foreground">Actual</div>
              </div>
            </div>

            {/* Stock Status */}
            {stockStatus && (
              <div className="text-center">
                <StockStatusBadge
                  actualQuantity={finalQuantity}
                  minimumThreshold={currentItem.minimum_threshold}
                  maximumThreshold={currentItem.maximum_threshold}
                />
              </div>
            )}

            {/* Variance Alert */}
            {variance !== null && variance !== 0 && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                variance > 0 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">
                  Variance: {variance > 0 ? '+' : ''}{variance} {currentItem.base_unit?.name || 'units'}
                </span>
              </div>
            )}

            {/* Quick Adjust Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuickAdjust(-1)}
                className="h-12"
              >
                <Minus className="h-4 w-4 mr-1" />
                -1
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuantityUpdate(expectedQty)}
                className="h-12"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Exact
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuickAdjust(1)}
                className="h-12"
              >
                <Plus className="h-4 w-4 mr-1" />
                +1
              </Button>
            </div>

            {/* Manual Input */}
            <div className="flex gap-2">
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter quantity"
                className="text-lg h-12"
                step="0.01"
              />
              <Button
                onClick={() => {
                  const value = parseFloat(inputValue);
                  if (!isNaN(value) && value >= 0) {
                    handleQuantityUpdate(value);
                  }
                }}
                disabled={!inputValue || isNaN(parseFloat(inputValue))}
                size="lg"
                className="h-12 px-6"
              >
                Set
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" className="h-12">
                <Scan className="h-4 w-4 mr-2" />
                Scan
              </Button>
              <Button variant="outline" size="lg" className="h-12">
                <Camera className="h-4 w-4 mr-2" />
                Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
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
  );
};