import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { inventoryCountsApi } from '@/contexts/inventory/api';
import { InventoryCount, InventoryCountItem } from '@/contexts/inventory/types';
import { Package, Calendar, User, AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Target } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { StockStatusBadge } from './StockStatusBadge';
import { getStockStatusSummary } from '@/utils/stockStatus';

interface CountDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: InventoryCount | null;
}

export const CountDetailsDialog: React.FC<CountDetailsDialogProps> = ({
  open,
  onOpenChange,
  count
}) => {
  const [countItems, setCountItems] = useState<InventoryCountItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && count) {
      loadCountItems();
    }
  }, [open, count]);

  const loadCountItems = async () => {
    if (!count) return;
    
    setLoading(true);
    try {
      const items = await inventoryCountsApi.getCountItems(count.id);
      setCountItems(items);
    } catch (error) {
      console.error('Failed to load count items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVarianceColor = (variance: number) => {
    if (Math.abs(variance) < 0.01) return 'text-muted-foreground';
    return variance > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      default: return 'outline';
    }
  };

  if (!count) return null;

  const completedItems = countItems.filter(item => item.actual_quantity !== null);
  const totalVariance = countItems.reduce((sum, item) => {
    if (item.actual_quantity === null) return sum;
    return sum + Math.abs((item.actual_quantity || 0) - (item.expected_quantity || 0));
  }, 0);

  // Calculate stock status summary for completed items
  const stockStatusSummary = getStockStatusSummary(
    completedItems.map(item => ({
      actualQuantity: item.actual_quantity || 0,
      minimumThreshold: (item as any).inventory_items?.minimum_threshold,
      maximumThreshold: (item as any).inventory_items?.maximum_threshold,
    }))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Count Details
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of inventory count from {format(new Date(count.count_date), 'PPP')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Count Summary */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={getStatusColor(count.status)} className="text-sm">
                  {count.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {count.completion_percentage.toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {completedItems.length} of {countItems.length} items
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Variances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {count.variance_count}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total: {totalVariance.toFixed(2)} units
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Total Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {count.total_items_count}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Under Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {stockStatusSummary.underStock}
                </div>
                <div className="text-sm text-muted-foreground">
                  Low inventory items
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Over Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stockStatusSummary.overStock}
                </div>
                <div className="text-sm text-muted-foreground">
                  Excess inventory items
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Count Notes */}
          {count.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{count.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Count Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Count Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading count items...
                </div>
              ) : countItems.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No items found for this count
                </div>
              ) : (
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Min/Max</TableHead>
                        <TableHead className="text-center">Expected</TableHead>
                        <TableHead className="text-center">Actual</TableHead>
                        <TableHead className="text-center">Variance</TableHead>
                        <TableHead className="text-center">Stock Status</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead>Counted At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {countItems.map((item) => {
                        const variance = item.actual_quantity !== null 
                          ? (item.actual_quantity || 0) - (item.expected_quantity || 0)
                          : null;
                        const hasVariance = variance !== null && Math.abs(variance) > 0.01;
                        const inventoryItem = (item as any).inventory_items;
                        const finalQuantity = item.actual_quantity !== null ? item.actual_quantity : (item.expected_quantity || 0);

                        return (
                          <TableRow key={item.id} className={cn(
                            "hover:bg-muted/50",
                            hasVariance && "bg-amber-50 border-amber-200"
                          )}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {inventoryItem?.name || 'Unknown Item'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  SKU: {inventoryItem?.sku || 'N/A'}
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <div className="text-sm">
                                <div className="flex items-center justify-center gap-1">
                                  <Target className="h-3 w-3 text-muted-foreground" />
                                  <span>{inventoryItem?.minimum_threshold ?? '—'} / {inventoryItem?.maximum_threshold ?? '—'}</span>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <div className="font-medium">{item.expected_quantity}</div>
                              <div className="text-xs text-muted-foreground">units</div>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              {item.actual_quantity !== null ? (
                                <div className="font-medium">{item.actual_quantity}</div>
                              ) : (
                                <span className="text-muted-foreground">Not counted</span>
                              )}
                            </TableCell>
                            
                            <TableCell className="text-center">
                              {variance !== null ? (
                                <div className={cn(
                                  "flex items-center justify-center gap-1 font-medium",
                                  getVarianceColor(variance)
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
                            
                            <TableCell className="text-center">
                              <StockStatusBadge
                                actualQuantity={finalQuantity}
                                minimumThreshold={inventoryItem?.minimum_threshold}
                                maximumThreshold={inventoryItem?.maximum_threshold}
                                size="sm"
                              />
                            </TableCell>
                            
                            <TableCell className="text-center">
                              {item.actual_quantity !== null ? (
                                <Badge variant="default" className="text-xs">
                                  Counted
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            
                            <TableCell>
                              {item.counted_at ? (
                                <div className="text-sm">
                                  {format(new Date(item.counted_at), 'MMM d, yyyy')}
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(item.counted_at), 'h:mm a')}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Not counted</span>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};