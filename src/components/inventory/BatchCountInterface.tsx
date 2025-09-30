import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InventoryCountItem, InventoryItem } from '@/contexts/inventory/types';
import { CheckCircle, AlertTriangle, Package, Search, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StockStatusBadge } from './StockStatusBadge';
import { getStockStatus } from '@/utils/stockStatus';

interface BatchCountInterfaceProps {
  countItems: InventoryCountItem[];
  items: InventoryItem[];
  onBulkUpdate: (updates: Array<{ itemId: string; actualQuantity: number }>) => Promise<void>;
  onCompleteCount: () => void;
  progress: number;
  completedItems: number;
  totalItems: number;
  isLoading?: boolean;
  isCompletingCount?: boolean;
}

export const BatchCountInterface: React.FC<BatchCountInterfaceProps> = ({
  countItems,
  items,
  onBulkUpdate,
  onCompleteCount,
  progress,
  completedItems,
  totalItems,
  isLoading = false,
  isCompletingCount = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localCounts, setLocalCounts] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  // Filter items based on search
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize local counts from existing count items - only on first load
  useEffect(() => {
    const initialCounts: Record<string, string> = {};
    countItems.forEach(countItem => {
      if (countItem.actual_quantity !== null && countItem.actual_quantity !== undefined) {
        initialCounts[countItem.item_id] = countItem.actual_quantity.toString();
      }
    });
    
    // Only update if we don't already have values for these items (prevents overwriting user input)
    setLocalCounts(prev => {
      const newCounts = { ...prev };
      let hasChanges = false;
      
      countItems.forEach(countItem => {
        if (countItem.actual_quantity !== null && countItem.actual_quantity !== undefined) {
          // Only set if we don't have a value yet or if the user isn't actively editing
          if (!prev[countItem.item_id]) {
            newCounts[countItem.item_id] = countItem.actual_quantity.toString();
            hasChanges = true;
          }
        }
      });
      
      return hasChanges ? newCounts : prev;
    });
  }, [countItems]);

  const handleInputChange = (itemId: string, value: string) => {
    setLocalCounts(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string, index: number) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < filteredItems.length) {
        const nextItemId = filteredItems[nextIndex].id;
        const nextInput = inputRefs.current[nextItemId];
        if (nextInput) {
          nextInput.focus();
          setCurrentFocusIndex(nextIndex);
        }
      } else if (e.key === 'Enter') {
        // If Enter on last item, submit
        handleBulkSubmit();
      }
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      const prevItemId = filteredItems[index - 1].id;
      const prevInput = inputRefs.current[prevItemId];
      if (prevInput) {
        prevInput.focus();
        setCurrentFocusIndex(index - 1);
      }
    } else if (e.key === 'ArrowDown' && index < filteredItems.length - 1) {
      e.preventDefault();
      const nextItemId = filteredItems[index + 1].id;
      const nextInput = inputRefs.current[nextItemId];
      if (nextInput) {
        nextInput.focus();
        setCurrentFocusIndex(index + 1);
      }
    }
  };

  const handleBulkSubmit = async () => {
    const updates = Object.entries(localCounts)
      .filter(([_, value]) => value.trim() !== '')
      .map(([itemId, value]) => ({
        itemId,
        actualQuantity: parseFloat(value)
      }))
      .filter(update => !isNaN(update.actualQuantity) && update.actualQuantity >= 0);

    if (updates.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onBulkUpdate(updates);
    } catch (error) {
      console.error('Bulk update failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAll = () => {
    setLocalCounts({});
  };

  const handleFillExpected = () => {
    const expectedCounts: Record<string, string> = {};
    filteredItems.forEach(item => {
      const countItem = countItems.find(ci => ci.item_id === item.id);
      const inStockQty = countItem?.in_stock_quantity || item.current_stock || 0;
      expectedCounts[item.id] = inStockQty.toString();
    });
    setLocalCounts(expectedCounts);
  };

  const getPendingUpdatesCount = () => {
    return Object.entries(localCounts).filter(([itemId, value]) => {
      const countItem = countItems.find(ci => ci.item_id === itemId);
      const currentValue = countItem?.actual_quantity?.toString() || '';
      return value.trim() !== '' && value !== currentValue;
    }).length;
  };

  const getItemData = (item: InventoryItem) => {
    const countItem = countItems.find(ci => ci.item_id === item.id);
    const inStockQty = countItem?.in_stock_quantity || item.current_stock || 0;
    const localValue = localCounts[item.id] || '';
    const actualQty = localValue ? parseFloat(localValue) : null;
    const variance = actualQty !== null && !isNaN(actualQty) ? actualQty - inStockQty : null;
    const hasUnsavedChanges = localValue !== (countItem?.actual_quantity?.toString() || '');
    
    // Get stock status for the item using template values when available
    const finalQuantity = actualQty !== null ? actualQty : inStockQty;
    const stockStatus = getStockStatus(
      finalQuantity, 
      item.minimum_threshold, 
      item.maximum_threshold,
      countItem?.template_minimum_quantity,
      countItem?.template_maximum_quantity
    );

    return { 
      inStockQty, 
      actualQty, 
      variance, 
      hasUnsavedChanges, 
      localValue, 
      stockStatus,
      finalQuantity,
      countItem
    };
  };

  return (
    <div className="space-y-4">
      {/* Header with Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Batch Count Entry
            </CardTitle>
            <Badge variant="secondary">
              {completedItems} of {totalItems} counted
            </Badge>
          </div>
          <CardDescription>
            Enter quantities and submit all at once. Use Tab/Enter to move between fields.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items by name, category, or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleBulkSubmit}
                disabled={getPendingUpdatesCount() === 0 || isSubmitting}
                size="sm"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Submit {getPendingUpdatesCount()} Updates
              </Button>
              <Button variant="outline" onClick={handleClearAll} size="sm">
                Clear All
              </Button>
              <Button 
                onClick={onCompleteCount}
                disabled={completedItems === 0 || isCompletingCount}
                variant="default"
                size="sm"
              >
                {isCompletingCount ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Count
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Count Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[300px]">Item</TableHead>
                  <TableHead className="w-[80px] text-center">Min</TableHead>
                  <TableHead className="w-[80px] text-center">Max</TableHead>
                  <TableHead className="w-[100px] text-center">In-Stock</TableHead>
                  <TableHead className="w-[120px] text-center">Actual Count</TableHead>
                  <TableHead className="w-[100px] text-center">Variance</TableHead>
                  <TableHead className="w-[120px] text-center">Stock Status</TableHead>
                  <TableHead className="w-[80px] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => {
                  const { inStockQty, actualQty, variance, hasUnsavedChanges, localValue, stockStatus, finalQuantity, countItem } = getItemData(item);
                  
                  return (
                    <TableRow key={item.id} className={cn(
                      "group hover:bg-muted/50",
                      hasUnsavedChanges && "bg-amber-50 border-amber-200",
                      stockStatus.isLowStock && "bg-red-50/50",
                      stockStatus.isOverStock && "bg-orange-50/50"
                    )}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.sku && <span>SKU: {item.sku} • </span>}
                            {item.category?.name || 'No category'}
                            {item.location && <span> • {item.location}</span>}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="text-sm font-medium">
                          {countItem?.template_minimum_quantity ?? item.minimum_threshold ?? '—'}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="text-sm font-medium">
                          {countItem?.template_maximum_quantity ?? item.maximum_threshold ?? '—'}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="font-medium">{inStockQty}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.base_unit?.name || 'units'}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Input
                            ref={(el) => {
                              if (el) inputRefs.current[item.id] = el;
                            }}
                            type="number"
                            value={localValue}
                            onChange={(e) => handleInputChange(item.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.id, index)}
                            placeholder="0"
                            className={cn(
                              "w-20 text-center",
                              hasUnsavedChanges && "border-amber-400 bg-amber-50"
                            )}
                            step="0.01"
                            disabled={isSubmitting}
                          />
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        {variance !== null ? (
                          <div className={cn(
                            "flex items-center justify-center gap-1 font-medium",
                            variance > 0 ? "text-green-600" : 
                            variance < 0 ? "text-red-600" : 
                            "text-muted-foreground"
                          )}>
                            {variance !== 0 && (
                              variance > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
                            )}
                            {variance > 0 ? '+' : ''}{variance}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <StockStatusBadge
                          actualQuantity={finalQuantity}
                          minimumThreshold={item.minimum_threshold}
                          maximumThreshold={item.maximum_threshold}
                          templateMinimum={countItem?.template_minimum_quantity}
                          templateMaximum={countItem?.template_maximum_quantity}
                          size="sm"
                        />
                      </TableCell>
                      
                      <TableCell className="text-center">
                        {hasUnsavedChanges ? (
                          <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                            Pending
                          </Badge>
                        ) : actualQty !== null ? (
                          <Badge variant="default" className="text-xs">
                            Counted
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No items found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};