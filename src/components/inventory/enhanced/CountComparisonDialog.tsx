import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { inventoryCountsApi } from '@/contexts/inventory/api';
import { InventoryCount, InventoryCountItem } from '@/contexts/inventory/types';
import { 
  GitCompare, TrendingUp, TrendingDown, Calendar, DollarSign, 
  AlertTriangle, Target, ArrowRight, Package, BarChart3, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

interface CountComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: InventoryCount | null;
  previousCount?: InventoryCount | null;
  counts: InventoryCount[];
}

export const CountComparisonDialog: React.FC<CountComparisonDialogProps> = ({
  open,
  onOpenChange,
  currentCount,
  previousCount,
  counts
}) => {
  const [selectedPreviousCountId, setSelectedPreviousCountId] = useState<string>('');
  const [currentItems, setCurrentItems] = useState<InventoryCountItem[]>([]);
  const [previousItems, setPreviousItems] = useState<InventoryCountItem[]>([]);
  const [loading, setLoading] = useState(false);

  const actualPreviousCount = selectedPreviousCountId 
    ? counts.find(c => c.id === selectedPreviousCountId) || null
    : previousCount;

  useEffect(() => {
    if (open && currentCount) {
      // Set default previous count
      if (!selectedPreviousCountId && previousCount) {
        setSelectedPreviousCountId(previousCount.id);
      }
      loadComparisonData();
    }
  }, [open, currentCount, selectedPreviousCountId]);

  const loadComparisonData = async () => {
    if (!currentCount) return;
    
    setLoading(true);
    try {
      const currentItemsData = await inventoryCountsApi.getCountItems(currentCount.id);
      setCurrentItems(currentItemsData);

      if (actualPreviousCount) {
        const previousItemsData = await inventoryCountsApi.getCountItems(actualPreviousCount.id);
        setPreviousItems(previousItemsData);
      }
    } catch (error) {
      console.error('Failed to load comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentCount) return null;

  // Get available previous counts (excluding current)
  const availablePreviousCounts = counts
    .filter(c => c.id !== currentCount.id && c.status === 'completed')
    .sort((a, b) => new Date(b.count_date).getTime() - new Date(a.count_date).getTime())
    .slice(0, 10); // Limit to last 10 for performance

  // Calculate comparison metrics
  const calculateComparison = () => {
    if (!actualPreviousCount) return null;

    // Basic metrics comparison
    const currentAccuracy = currentCount.total_items_count > 0 ? 
      ((currentCount.total_items_count - currentCount.variance_count) / currentCount.total_items_count) * 100 : 0;
    const previousAccuracy = actualPreviousCount.total_items_count > 0 ? 
      ((actualPreviousCount.total_items_count - actualPreviousCount.variance_count) / actualPreviousCount.total_items_count) * 100 : 0;

    // Mock financial calculations (in real app, use actual item costs)
    const currentValue = currentCount.total_items_count * 25;
    const previousValue = actualPreviousCount.total_items_count * 25;
    const currentVarianceCost = currentCount.variance_count * 15;
    const previousVarianceCost = actualPreviousCount.variance_count * 15;

    // Item-level comparisons
    const itemComparisons = currentItems.map(currentItem => {
      const previousItem = previousItems.find(p => p.item_id === currentItem.item_id);
      const currentQuantity = currentItem.actual_quantity || currentItem.in_stock_quantity || 0;
      const previousQuantity = previousItem ? 
        (previousItem.actual_quantity || previousItem.in_stock_quantity || 0) : 0;
      
      const unitCost = (currentItem as any).inventory_items?.unit_cost || 
                      (currentItem as any).inventory_items?.purchase_price || 15;
      
      return {
        itemId: currentItem.item_id,
        itemName: (currentItem as any).inventory_items?.name || 'Unknown Item',
        itemSku: (currentItem as any).inventory_items?.sku || 'N/A',
        currentQuantity,
        previousQuantity,
        quantityChange: currentQuantity - previousQuantity,
        currentValue: currentQuantity * unitCost,
        previousValue: previousQuantity * unitCost,
        valueChange: (currentQuantity - previousQuantity) * unitCost,
        unitCost,
        hasComparison: !!previousItem
      };
    });

    return {
      accuracy: { current: currentAccuracy, previous: previousAccuracy, change: currentAccuracy - previousAccuracy },
      variances: { current: currentCount.variance_count, previous: actualPreviousCount.variance_count, change: currentCount.variance_count - actualPreviousCount.variance_count },
      items: { current: currentCount.total_items_count, previous: actualPreviousCount.total_items_count, change: currentCount.total_items_count - actualPreviousCount.total_items_count },
      value: { current: currentValue, previous: previousValue, change: currentValue - previousValue },
      varianceCost: { current: currentVarianceCost, previous: previousVarianceCost, change: currentVarianceCost - previousVarianceCost },
      itemComparisons
    };
  };

  const comparison = calculateComparison();

  const MetricComparisonCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    current: number;
    previous: number;
    change: number;
    format: 'number' | 'currency' | 'percentage';
    isGoodChange?: (change: number) => boolean;
  }> = ({ title, icon, current, previous, change, format, isGoodChange }) => {
    const formatValue = (value: number) => {
      switch (format) {
        case 'currency': return formatCurrency(value);
        case 'percentage': return formatPercentage(value);
        default: return value.toString();
      }
    };

    const isPositiveChange = isGoodChange ? isGoodChange(change) : change >= 0;

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Current:</span>
            <span className="font-bold">{formatValue(current)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Previous:</span>
            <span className="font-medium">{formatValue(previous)}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-xs font-medium">Change:</span>
            <div className={cn(
              "flex items-center gap-1 font-bold",
              isPositiveChange ? "text-green-600" : "text-red-600"
            )}>
              {isPositiveChange ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {change >= 0 ? '+' : ''}{formatValue(change)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Count Comparison Analysis
          </DialogTitle>
          <DialogDescription>
            Detailed comparison between current count and selected previous count
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Comparison Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Comparison Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Count</label>
                  <div className="p-2 border rounded bg-muted/30">
                    <div className="font-medium">{format(new Date(currentCount.count_date), 'PPP')}</div>
                    <div className="text-sm text-muted-foreground">
                      {currentCount.team_name || 'No team'} • {currentCount.total_items_count} items
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Compare With</label>
                  <Select 
                    value={selectedPreviousCountId} 
                    onValueChange={setSelectedPreviousCountId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select previous count..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePreviousCounts.map(count => (
                        <SelectItem key={count.id} value={count.id}>
                          {format(new Date(count.count_date), 'MMM dd, yyyy')} - 
                          {count.team_name || 'No team'} ({count.total_items_count} items)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {comparison && actualPreviousCount ? (
            <>
              {/* High-Level Metrics Comparison */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MetricComparisonCard
                  title="Accuracy Rate"
                  icon={<Target className="h-4 w-4" />}
                  current={comparison.accuracy.current}
                  previous={comparison.accuracy.previous}
                  change={comparison.accuracy.change}
                  format="percentage"
                  isGoodChange={(change) => change >= 0}
                />

                <MetricComparisonCard
                  title="Total Items"
                  icon={<Package className="h-4 w-4" />}
                  current={comparison.items.current}
                  previous={comparison.items.previous}
                  change={comparison.items.change}
                  format="number"
                />

                <MetricComparisonCard
                  title="Variances"
                  icon={<AlertTriangle className="h-4 w-4" />}
                  current={comparison.variances.current}
                  previous={comparison.variances.previous}
                  change={comparison.variances.change}
                  format="number"
                  isGoodChange={(change) => change <= 0}
                />

                <MetricComparisonCard
                  title="Inventory Value"
                  icon={<DollarSign className="h-4 w-4" />}
                  current={comparison.value.current}
                  previous={comparison.value.previous}
                  change={comparison.value.change}
                  format="currency"
                />

                <MetricComparisonCard
                  title="Variance Cost"
                  icon={<BarChart3 className="h-4 w-4" />}
                  current={comparison.varianceCost.current}
                  previous={comparison.varianceCost.previous}
                  change={comparison.varianceCost.change}
                  format="currency"
                  isGoodChange={(change) => change <= 0}
                />
              </div>

              {/* Summary Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Performance Changes</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          {comparison.accuracy.change >= 0 ? 
                            <div className="w-2 h-2 bg-green-500 rounded-full" /> :
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                          }
                          <span>
                            Accuracy {comparison.accuracy.change >= 0 ? 'improved' : 'decreased'} by {formatPercentage(Math.abs(comparison.accuracy.change))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {comparison.variances.change <= 0 ? 
                            <div className="w-2 h-2 bg-green-500 rounded-full" /> :
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                          }
                          <span>
                            Variances {comparison.variances.change <= 0 ? 'reduced' : 'increased'} by {Math.abs(comparison.variances.change)} items
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {comparison.varianceCost.change <= 0 ? 
                            <div className="w-2 h-2 bg-green-500 rounded-full" /> :
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                          }
                          <span>
                            Variance cost impact {comparison.varianceCost.change <= 0 ? 'decreased' : 'increased'} by {formatCurrency(Math.abs(comparison.varianceCost.change))}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Financial Impact</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total value change:</span>
                          <span className={cn(
                            "font-medium",
                            comparison.value.change >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {comparison.value.change >= 0 ? '+' : ''}{formatCurrency(comparison.value.change)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost impact improvement:</span>
                          <span className={cn(
                            "font-medium",
                            comparison.varianceCost.change <= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {comparison.varianceCost.change <= 0 ? 
                              `Saved ${formatCurrency(Math.abs(comparison.varianceCost.change))}` :
                              `Cost increase ${formatCurrency(comparison.varianceCost.change)}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Item-Level Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Item-by-Item Comparison</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Showing items with quantity or value changes between counts
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Loading comparison data...
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-center">Unit Cost</TableHead>
                            <TableHead className="text-center">Previous Qty</TableHead>
                            <TableHead className="text-center">Current Qty</TableHead>
                            <TableHead className="text-center">Qty Change</TableHead>
                            <TableHead className="text-center">Value Change</TableHead>
                            <TableHead className="text-center">Impact</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comparison.itemComparisons
                            .filter(item => Math.abs(item.quantityChange) > 0 || !item.hasComparison)
                            .map((item) => {
                              const hasSignificantChange = Math.abs(item.quantityChange) > 0;
                              const isPositiveChange = item.quantityChange >= 0;

                              return (
                                <TableRow 
                                  key={item.itemId}
                                  className={cn(
                                    "hover:bg-muted/50",
                                    hasSignificantChange && "bg-blue-50 border-blue-200"
                                  )}
                                >
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="font-medium">{item.itemName}</div>
                                      <div className="text-sm text-muted-foreground">
                                        SKU: {item.itemSku}
                                      </div>
                                      {!item.hasComparison && (
                                        <Badge variant="outline" className="text-xs">New Item</Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  
                                  <TableCell className="text-center">
                                    <div className="font-medium">{formatCurrency(item.unitCost)}</div>
                                  </TableCell>
                                  
                                  <TableCell className="text-center">
                                    <div className="font-medium">
                                      {item.hasComparison ? item.previousQuantity : '—'}
                                    </div>
                                  </TableCell>
                                  
                                  <TableCell className="text-center">
                                    <div className="font-medium">{item.currentQuantity}</div>
                                  </TableCell>
                                  
                                  <TableCell className="text-center">
                                    {item.hasComparison && hasSignificantChange ? (
                                      <div className={cn(
                                        "flex items-center justify-center gap-1 font-medium",
                                        isPositiveChange ? "text-green-600" : "text-red-600"
                                      )}>
                                        {isPositiveChange ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {isPositiveChange ? '+' : ''}{item.quantityChange}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                  
                                  <TableCell className="text-center">
                                    {item.hasComparison ? (
                                      <div className={cn(
                                        "font-medium",
                                        item.valueChange >= 0 ? "text-green-600" : "text-red-600"
                                      )}>
                                        {item.valueChange >= 0 ? '+' : ''}{formatCurrency(item.valueChange)}
                                      </div>
                                    ) : (
                                      <div className="font-medium text-blue-600">
                                        +{formatCurrency(item.currentValue)}
                                      </div>
                                    )}
                                  </TableCell>
                                  
                                  <TableCell className="text-center">
                                    {hasSignificantChange ? (
                                      <Badge 
                                        variant={Math.abs(item.valueChange) > 100 ? "destructive" : "secondary"}
                                        className="text-xs"
                                      >
                                        {Math.abs(item.valueChange) > 100 ? "High Impact" : "Low Impact"}
                                      </Badge>
                                    ) : !item.hasComparison ? (
                                      <Badge variant="outline" className="text-xs">New</Badge>
                                    ) : (
                                      <Badge variant="default" className="text-xs">No Change</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a Count to Compare</h3>
                <p>Choose a previous count from the dropdown above to see detailed comparisons</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};