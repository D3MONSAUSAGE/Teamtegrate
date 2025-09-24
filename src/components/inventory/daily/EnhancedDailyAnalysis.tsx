import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StockStatusBadge } from '@/components/inventory/StockStatusBadge';
import { Package, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface EnhancedDailyAnalysisProps {
  itemsData: {
    items: Array<{
      id: string;
      item_name?: string;
      item_sku?: string;
      item_barcode?: string;
      category_name?: string;
      location?: string;
      unit_cost?: number;
      minimum_threshold?: number;
      maximum_threshold?: number;
      template_minimum_quantity?: number;
      template_maximum_quantity?: number;
      in_stock_quantity?: number;
      actual_quantity?: number | null;
      variance_quantity?: number;
      variance_cost?: number;
      stock_status?: 'normal' | 'low' | 'out' | 'over';
      total_value?: number;
    }>;
    loading: boolean;
    summary: {
      totalItems: number;
      countedItems: number;
      totalVariances: number;
      totalValue: number;
      totalVarianceCost: number;
      stockIssues: {
        underStock: number;
        overStock: number;
        outOfStock: number;
      };
    };
  };
  selectedDate: Date;
}

export const EnhancedDailyAnalysis: React.FC<EnhancedDailyAnalysisProps> = ({
  itemsData,
  selectedDate,
}) => {
  const { items, loading, summary } = itemsData;

  // Use summary data when available, fall back to calculations
  const metrics = useMemo(() => {
    if (summary.totalItems > 0) {
      return {
        totalItems: summary.totalItems,
        completedItems: summary.countedItems,
        totalValue: summary.totalValue,
        totalCostImpact: summary.totalVarianceCost,
        minMaxViolations: summary.stockIssues.underStock + summary.stockIssues.overStock,
        varianceCount: summary.totalVariances,
        underStockCount: summary.stockIssues.underStock,
        overStockCount: summary.stockIssues.overStock,
      };
    }

    // Fallback calculations if summary is not available
    const totalItems = items.length;
    const countedItems = items.filter(item => item.actual_quantity !== null);
    const completedItems = countedItems.length;
    
    // Calculate financial metrics
    const totalValue = countedItems.reduce((sum, item) => 
      sum + ((item.actual_quantity || 0) * (item.unit_cost || 0)), 0
    );
    
    // Calculate variances and cost impact
    let totalCostImpact = 0;
    let varianceCount = 0;
    let minMaxViolations = 0;
    
    items.forEach(item => {
      if (item.actual_quantity !== null) {
        const variance = item.variance_quantity || 
          (item.actual_quantity - (item.in_stock_quantity || 0));
        if (Math.abs(variance) > 0.01) {
          varianceCount++;
          totalCostImpact += variance * (item.unit_cost || 0);
        }
        
        // Check min/max violations
        const minThreshold = item.template_minimum_quantity || item.minimum_threshold;
        const maxThreshold = item.template_maximum_quantity || item.maximum_threshold;
        const currentQuantity = item.actual_quantity;
        
        const isUnderStock = minThreshold && currentQuantity < minThreshold;
        const isOverStock = maxThreshold && currentQuantity > maxThreshold;
        
        if (isUnderStock || isOverStock) {
          minMaxViolations++;
        }
      }
    });
    
    // Calculate stock status counts
    let underStockCount = 0;
    let overStockCount = 0;
    
    items.forEach(item => {
      if (item.stock_status === 'low') underStockCount++;
      if (item.stock_status === 'over') overStockCount++;
    });
    
    return {
      totalItems,
      completedItems,
      totalValue,
      totalCostImpact,
      minMaxViolations,
      varianceCount,
      underStockCount,
      overStockCount,
    };
  }, [items, summary]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Enhanced Daily Analysis
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Complete view with min/max thresholds, locations, and stock violations for {selectedDate.toLocaleDateString()}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading daily analysis...
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No inventory activity found for this date
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats with Financial Totals */}
            <div className="px-6 py-4 bg-muted/50 border-b">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Items:</span>
                  <span className="ml-2 font-medium">{metrics.totalItems}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Counted:</span>
                  <span className="ml-2 font-medium">{metrics.completedItems}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Value:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {formatCurrency(metrics.totalValue)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cost Impact:</span>
                  <span className={cn(
                    "ml-2 font-medium",
                    metrics.totalCostImpact >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {metrics.totalCostImpact >= 0 ? '+' : ''}{formatCurrency(metrics.totalCostImpact)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Min/Max Violations:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {metrics.minMaxViolations}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">With Variances:</span>
                  <span className="ml-2 font-medium text-orange-600">{metrics.varianceCount}</span>
                </div>
              </div>
            </div>

            <div className="max-h-[600px] overflow-auto overflow-x-auto">
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
                  {items.map((item) => {
                    const variance = item.variance_quantity !== undefined 
                      ? item.variance_quantity 
                      : (item.actual_quantity !== null 
                          ? (item.actual_quantity - (item.in_stock_quantity || 0))
                          : null);
                    const unitCost = item.unit_cost || 15;
                    const costImpact = variance !== null ? variance * unitCost : 0;
                    const hasVariance = variance !== null && Math.abs(variance) > 0.01;

                    // Determine min/max values (prioritize template values)
                    const minThreshold = item.template_minimum_quantity || item.minimum_threshold;
                    const maxThreshold = item.template_maximum_quantity || item.maximum_threshold;
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
                              {item.item_name || 'Unknown Item'}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              <div>SKU: {item.item_sku || 'N/A'}</div>
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Location/Barcode */}
                        <TableCell className="text-center">
                          <div className="space-y-1 text-xs">
                            <div className="font-medium">
                              {item.location || 'N/A'}
                            </div>
                            {item.item_barcode && (
                              <div className="font-mono text-muted-foreground bg-muted px-1 py-0.5 rounded text-[10px]">
                                {item.item_barcode}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell className="text-center">
                          <div className="text-xs">
                            {item.category_name || 'Uncategorized'}
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
                          <div className="font-medium">{item.in_stock_quantity || 0}</div>
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
                              minimumThreshold={item.minimum_threshold}
                              maximumThreshold={item.maximum_threshold}
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
                {metrics.underStockCount > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{metrics.underStockCount} items need reordering</span>
                  </div>
                )}
                {metrics.overStockCount > 0 && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{metrics.overStockCount} items are overstocked</span>
                  </div>
                )}
                {metrics.varianceCount > 0 && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>{metrics.varianceCount} items have count variances</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};