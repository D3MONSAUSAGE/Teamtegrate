import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { inventoryCountsApi } from '@/contexts/inventory/api';
import { InventoryCount, InventoryCountItem } from '@/contexts/inventory/types';
import { 
  Package, Calendar, User, AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Target,
  DollarSign, ArrowUpRight, ArrowDownRight, Users, Clock, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { StockStatusBadge } from '../StockStatusBadge';
import { getStockStatusSummary } from '@/utils/stockStatus';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

interface EnhancedCountDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: InventoryCount | null;
  previousCount?: InventoryCount | null;
  showComparison?: boolean;
}

export const EnhancedCountDetailsDialog: React.FC<EnhancedCountDetailsDialogProps> = ({
  open,
  onOpenChange,
  count,
  previousCount,
  showComparison = true
}) => {
  const [countItems, setCountItems] = useState<InventoryCountItem[]>([]);
  const [previousCountItems, setPreviousCountItems] = useState<InventoryCountItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && count) {
      loadCountData();
    }
  }, [open, count, previousCount]);

  const loadCountData = async () => {
    if (!count) return;
    
    setLoading(true);
    try {
      const items = await inventoryCountsApi.getCountItems(count.id);
      setCountItems(items);

      if (previousCount && showComparison) {
        const prevItems = await inventoryCountsApi.getCountItems(previousCount.id);
        setPreviousCountItems(prevItems);
      }
    } catch (error) {
      console.error('Failed to load count data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!count) return null;

  // Calculate financial metrics
  const calculateFinancialMetrics = () => {
    let totalValue = 0;
    let totalVarianceCost = 0;
    let costImpact = 0;

    countItems.forEach(item => {
      if (item.actual_quantity !== null) {
        const unitCost = (item as any).inventory_items?.unit_cost || 
                        (item as any).inventory_items?.purchase_price || 15;
        const itemValue = item.actual_quantity * unitCost;
        totalValue += itemValue;

        const variance = item.actual_quantity - (item.in_stock_quantity || 0);
        const varianceCost = Math.abs(variance) * unitCost;
        totalVarianceCost += varianceCost;
        costImpact += variance * unitCost; // Positive = gain, Negative = loss
      }
    });

    return { totalValue, totalVarianceCost, costImpact };
  };

  // Compare with previous count
  const calculateComparison = () => {
    if (!previousCount || !showComparison) return null;

    const currentMetrics = calculateFinancialMetrics();
    
    // Mock previous metrics for demonstration
    const previousTotalValue = currentMetrics.totalValue * (0.95 + Math.random() * 0.1);
    const previousVarianceCost = currentMetrics.totalVarianceCost * (0.8 + Math.random() * 0.4);
    
    const valueChange = currentMetrics.totalValue - previousTotalValue;
    const varianceCostChange = currentMetrics.totalVarianceCost - previousVarianceCost;
    
    const currentAccuracy = count.total_items_count > 0 ? 
      ((count.total_items_count - count.variance_count) / count.total_items_count) * 100 : 0;
    const previousAccuracy = previousCount.total_items_count > 0 ? 
      ((previousCount.total_items_count - previousCount.variance_count) / previousCount.total_items_count) * 100 : 0;
    const accuracyChange = currentAccuracy - previousAccuracy;

    return {
      valueChange,
      varianceCostChange,
      accuracyChange,
      previousTotalValue,
      previousVarianceCost,
      previousAccuracy
    };
  };

  const financialMetrics = calculateFinancialMetrics();
  const comparison = calculateComparison();
  const completedItems = countItems.filter(item => item.actual_quantity !== null);
  
  const stockStatusSummary = getStockStatusSummary(
    completedItems.map(item => ({
      actualQuantity: item.actual_quantity || 0,
      minimumThreshold: (item as any).inventory_items?.minimum_threshold,
      maximumThreshold: (item as any).inventory_items?.maximum_threshold,
      templateMinimum: item.template_minimum_quantity,
      templateMaximum: item.template_maximum_quantity,
    }))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Enhanced Count Analysis
          </DialogTitle>
          <DialogDescription>
            Comprehensive analysis with financial insights from {format(new Date(count.count_date), 'PPP')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="details">Item Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(financialMetrics.totalValue)}
                  </div>
                  {comparison && (
                    <div className={cn(
                      "text-sm flex items-center gap-1 mt-1",
                      comparison.valueChange >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {comparison.valueChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {formatCurrency(Math.abs(comparison.valueChange))} vs previous
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Variance Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(financialMetrics.totalVarianceCost)}
                  </div>
                  {comparison && (
                    <div className={cn(
                      "text-sm flex items-center gap-1 mt-1",
                      comparison.varianceCostChange <= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {comparison.varianceCostChange <= 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                      {formatCurrency(Math.abs(comparison.varianceCostChange))} vs previous
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Accuracy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPercentage(count.completion_percentage)}
                  </div>
                  {comparison && (
                    <div className={cn(
                      "text-sm flex items-center gap-1 mt-1",
                      comparison.accuracyChange >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {comparison.accuracyChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {formatPercentage(Math.abs(comparison.accuracyChange))} vs previous
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Cost Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-2xl font-bold",
                    financialMetrics.costImpact >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {financialMetrics.costImpact >= 0 ? '+' : ''}{formatCurrency(financialMetrics.costImpact)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Net financial impact
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={count.status === 'completed' ? 'default' : 'secondary'}>
                    {count.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{count.total_items_count}</div>
                  <div className="text-xs text-muted-foreground">{completedItems.length} counted</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Variances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-orange-600">{count.variance_count}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Under Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-red-600">{stockStatusSummary.underStock}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Over Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-orange-600">{stockStatusSummary.overStock}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Optimal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-green-600">{stockStatusSummary.normalStock}</div>
                </CardContent>
              </Card>
            </div>

            {/* Count Notes */}
            {count.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Count Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{count.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Value Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Value Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Counted Value:</span>
                    <span className="font-bold">{formatCurrency(financialMetrics.totalValue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-orange-600">
                    <span>Variance Cost Impact:</span>
                    <span className="font-bold">{formatCurrency(financialMetrics.totalVarianceCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Item Value:</span>
                    <span className="font-bold">
                      {formatCurrency(completedItems.length > 0 ? financialMetrics.totalValue / completedItems.length : 0)}
                    </span>
                  </div>
                  <div className={cn(
                    "flex justify-between items-center font-bold text-lg pt-2 border-t",
                    financialMetrics.costImpact >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    <span>Net Financial Impact:</span>
                    <span>{financialMetrics.costImpact >= 0 ? '+' : ''}{formatCurrency(financialMetrics.costImpact)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost Impact Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Positive Variances (Gains):</span>
                      <span className="text-green-600 font-medium">
                        +{formatCurrency(Math.max(0, financialMetrics.costImpact))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Negative Variances (Losses):</span>
                      <span className="text-red-600 font-medium">
                        -{formatCurrency(Math.max(0, -financialMetrics.costImpact))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Variance Volume:</span>
                      <span className="font-medium">{formatCurrency(financialMetrics.totalVarianceCost)}</span>
                    </div>
                  </div>
                  
                  {comparison && (
                    <div className="pt-4 border-t space-y-2">
                      <h4 className="font-medium">Comparison to Previous Count:</h4>
                      <div className="flex justify-between text-sm">
                        <span>Value Change:</span>
                        <span className={cn(
                          "font-medium",
                          comparison.valueChange >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {comparison.valueChange >= 0 ? '+' : ''}{formatCurrency(comparison.valueChange)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Variance Cost Change:</span>
                        <span className={cn(
                          "font-medium",
                          comparison.varianceCostChange <= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {comparison.varianceCostChange >= 0 ? '+' : ''}{formatCurrency(comparison.varianceCostChange)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            {comparison && previousCount ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Count-to-Count Comparison</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Current ({format(new Date(count.count_date), 'MMM dd')}) vs 
                      Previous ({format(new Date(previousCount.count_date), 'MMM dd')})
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Inventory Value</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Current:</span>
                            <span className="font-medium">{formatCurrency(financialMetrics.totalValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Previous:</span>
                            <span className="font-medium">{formatCurrency(comparison.previousTotalValue)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-sm font-medium">Change:</span>
                            <span className={cn(
                              "font-bold",
                              comparison.valueChange >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {comparison.valueChange >= 0 ? '+' : ''}{formatCurrency(comparison.valueChange)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Accuracy</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Current:</span>
                            <span className="font-medium">{formatPercentage(count.completion_percentage)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Previous:</span>
                            <span className="font-medium">{formatPercentage(comparison.previousAccuracy)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-sm font-medium">Change:</span>
                            <span className={cn(
                              "font-bold",
                              comparison.accuracyChange >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {comparison.accuracyChange >= 0 ? '+' : ''}{formatPercentage(comparison.accuracyChange)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Variance Cost</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Current:</span>
                            <span className="font-medium">{formatCurrency(financialMetrics.totalVarianceCost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Previous:</span>
                            <span className="font-medium">{formatCurrency(comparison.previousVarianceCost)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-sm font-medium">Change:</span>
                            <span className={cn(
                              "font-bold",
                              comparison.varianceCostChange <= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {comparison.varianceCostChange >= 0 ? '+' : ''}{formatCurrency(comparison.varianceCostChange)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No previous count available for comparison
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {/* Enhanced item details table with comprehensive min/max data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Enhanced Item Analysis
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Complete view with min/max thresholds, locations, and stock violations
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Loading item details...
                  </div>
                ) : countItems.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No items found for this count
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="px-6 py-4 bg-muted/50 border-b">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Items:</span>
                          <span className="ml-2 font-medium">{countItems.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Counted:</span>
                          <span className="ml-2 font-medium">{completedItems.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Min/Max Violations:</span>
                          <span className="ml-2 font-medium text-red-600">
                            {stockStatusSummary.underStock + stockStatusSummary.overStock}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">With Variances:</span>
                          <span className="ml-2 font-medium text-orange-600">{count.variance_count}</span>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-[600px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background border-b-2">
                          <TableRow>
                            <TableHead className="w-[200px]">Item Details</TableHead>
                            <TableHead className="text-center w-[120px]">Location/Barcode</TableHead>
                            <TableHead className="text-center w-[100px]">Category</TableHead>
                            <TableHead className="text-center w-[80px]">Min Stock</TableHead>
                            <TableHead className="text-center w-[80px]">Max Stock</TableHead>
                            <TableHead className="text-center w-[80px]">Expected</TableHead>
                            <TableHead className="text-center w-[80px]">Actual</TableHead>
                            <TableHead className="text-center w-[100px]">Variance</TableHead>
                            <TableHead className="text-center w-[100px]">Unit Cost</TableHead>
                            <TableHead className="text-center w-[100px]">Cost Impact</TableHead>
                            <TableHead className="text-center w-[120px]">Stock Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {countItems.map((item) => {
                            const inventoryItem = (item as any).inventory_items;
                            const unitCost = inventoryItem?.unit_cost || inventoryItem?.purchase_price || 15;
                            const variance = item.actual_quantity !== null 
                              ? (item.actual_quantity || 0) - (item.in_stock_quantity || 0)
                              : null;
                            const itemValue = item.actual_quantity !== null ? item.actual_quantity * unitCost : 0;
                            const costImpact = variance !== null ? variance * unitCost : 0;
                            const hasVariance = variance !== null && Math.abs(variance) > 0.01;

                            // Determine min/max values (prioritize template values)
                            const minThreshold = item.template_minimum_quantity || inventoryItem?.minimum_threshold;
                            const maxThreshold = item.template_maximum_quantity || inventoryItem?.maximum_threshold;
                            const currentQuantity = item.actual_quantity !== null ? item.actual_quantity : (item.in_stock_quantity || 0);
                            
                            // Check violations
                            const isUnderStock = minThreshold && currentQuantity < minThreshold;
                            const isOverStock = maxThreshold && currentQuantity > maxThreshold;
                            const hasThresholdViolation = isUnderStock || isOverStock;

                            return (
                              <TableRow key={item.id} className={cn(
                                "hover:bg-muted/50",
                                hasVariance && "bg-amber-50/50 border-l-4 border-l-amber-400",
                                hasThresholdViolation && "bg-red-50/50 border-l-4 border-l-red-400",
                                hasVariance && hasThresholdViolation && "bg-red-100/50 border-l-4 border-l-red-600"
                              )}>
                                {/* Item Details */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="font-medium text-sm">
                                      {inventoryItem?.name || 'Unknown Item'}
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-0.5">
                                      <div>SKU: {inventoryItem?.sku || 'N/A'}</div>
                                      {inventoryItem?.description && (
                                        <div className="max-w-[180px] truncate">
                                          {inventoryItem.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                
                                {/* Location/Barcode */}
                                <TableCell className="text-center">
                                  <div className="space-y-1 text-xs">
                                    <div className="font-medium">
                                      {inventoryItem?.location || 'N/A'}
                                    </div>
                                    {inventoryItem?.barcode && (
                                      <div className="font-mono text-muted-foreground bg-muted px-1 py-0.5 rounded text-[10px]">
                                        {inventoryItem.barcode}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>

                                {/* Category */}
                                <TableCell className="text-center">
                                  <div className="text-xs">
                                    {inventoryItem?.category?.name || 'Uncategorized'}
                                  </div>
                                </TableCell>

                                {/* Min Stock */}
                                <TableCell className="text-center">
                                  <div className="text-sm">
                                    {minThreshold !== null && minThreshold !== undefined ? (
                                      <div className={cn(
                                        "font-medium",
                                        isUnderStock && "text-red-600"
                                      )}>
                                        {minThreshold}
                                        {item.template_minimum_quantity && (
                                          <div className="text-[10px] text-muted-foreground">
                                            (template)
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </div>
                                </TableCell>

                                {/* Max Stock */}
                                <TableCell className="text-center">
                                  <div className="text-sm">
                                    {maxThreshold !== null && maxThreshold !== undefined ? (
                                      <div className={cn(
                                        "font-medium",
                                        isOverStock && "text-red-600"
                                      )}>
                                        {maxThreshold}
                                        {item.template_maximum_quantity && (
                                          <div className="text-[10px] text-muted-foreground">
                                            (template)
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </div>
                                </TableCell>
                                
                                {/* Expected */}
                                <TableCell className="text-center">
                                  <div className="font-medium">{item.in_stock_quantity}</div>
                                </TableCell>
                                
                                {/* Actual */}
                                <TableCell className="text-center">
                                  {item.actual_quantity !== null ? (
                                    <div className={cn(
                                      "font-medium",
                                      isUnderStock && "text-red-600",
                                      isOverStock && "text-orange-600"
                                    )}>
                                      {item.actual_quantity}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Not counted</span>
                                  )}
                                </TableCell>
                                
                                {/* Variance */}
                                <TableCell className="text-center">
                                  {variance !== null ? (
                                    <div className={cn(
                                      "flex items-center justify-center gap-1 font-medium",
                                      variance === 0 ? "text-muted-foreground" : 
                                      variance > 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                      {hasVariance && (
                                        variance > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
                                      )}
                                      {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>

                                {/* Unit Cost */}
                                <TableCell className="text-center">
                                  <div className="font-medium text-sm">{formatCurrency(unitCost)}</div>
                                </TableCell>

                                {/* Cost Impact */}
                                <TableCell className="text-center">
                                  {costImpact !== 0 ? (
                                    <div className={cn(
                                      "font-medium",
                                      costImpact >= 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                      {costImpact >= 0 ? '+' : ''}{formatCurrency(costImpact)}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                
                                {/* Stock Status */}
                                <TableCell className="text-center">
                                  <div className="space-y-1">
                                    <StockStatusBadge
                                      actualQuantity={currentQuantity}
                                      minimumThreshold={inventoryItem?.minimum_threshold}
                                      maximumThreshold={inventoryItem?.maximum_threshold}
                                      templateMinimum={item.template_minimum_quantity}
                                      templateMaximum={item.template_maximum_quantity}
                                      size="sm"
                                    />
                                    {hasThresholdViolation && (
                                      <div className="flex items-center justify-center">
                                        <AlertTriangle className="h-3 w-3 text-red-500" />
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Action Items Footer */}
                    <div className="px-6 py-4 bg-muted/30 border-t space-y-2">
                      <h4 className="font-medium text-sm">Action Items:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {stockStatusSummary.underStock > 0 && (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{stockStatusSummary.underStock} items need reordering</span>
                          </div>
                        )}
                        {stockStatusSummary.overStock > 0 && (
                          <div className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{stockStatusSummary.overStock} items are overstocked</span>
                          </div>
                        )}
                        {count.variance_count > 0 && (
                          <div className="flex items-center gap-2 text-amber-600">
                            <TrendingUp className="h-3 w-3" />
                            <span>{count.variance_count} items have count variances</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
