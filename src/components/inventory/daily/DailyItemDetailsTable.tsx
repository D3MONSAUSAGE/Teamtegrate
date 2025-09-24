import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Package, AlertTriangle, CheckCircle, TrendingDown, TrendingUp, 
  DollarSign, Search, Filter, Eye, EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { DailyItemsData, DailyItemDetail } from '@/hooks/useDailyInventoryAnalytics';

interface DailyItemDetailsTableProps {
  itemsData: DailyItemsData;
}

const getStockStatusColor = (status: string) => {
  switch (status) {
    case 'out':
      return 'destructive';
    case 'low':
      return 'destructive';
    case 'over':
      return 'outline';
    default:
      return 'default';
  }
};

const getVarianceColor = (variance: number) => {
  if (Math.abs(variance) < 0.01) return 'text-muted-foreground';
  return variance > 0 ? 'text-green-600' : 'text-red-600';
};

export const DailyItemDetailsTable: React.FC<DailyItemDetailsTableProps> = ({
  itemsData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDetails, setShowDetails] = useState(true);

  if (itemsData.loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Daily Item Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading item details...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (itemsData.items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Daily Item Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">No items counted for selected date and team</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter items based on search and status
  const filteredItems = itemsData.items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'variances' && Math.abs(item.variance_quantity) > 0.01) ||
      (filterStatus === 'stock_issues' && ['low', 'out', 'over'].includes(item.stock_status)) ||
      (filterStatus === 'counted' && item.actual_quantity !== null);
    
    return matchesSearch && matchesStatus;
  });

  const { summary } = itemsData;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalItems}</div>
            <div className="text-xs text-muted-foreground">{summary.countedItems} counted</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Variances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.totalVariances}</div>
            <div className="text-xs text-orange-600">{formatCurrency(summary.totalVarianceCost)} impact</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.stockIssues.underStock + summary.stockIssues.overStock + summary.stockIssues.outOfStock}
            </div>
            <div className="text-xs text-red-600">
              {summary.stockIssues.outOfStock} out, {summary.stockIssues.underStock} low
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(summary.totalItems > 0 ? 
                ((summary.totalItems - summary.totalVariances) / summary.totalItems) * 100 : 100
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Item Details Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Item Details ({filteredItems.length} of {itemsData.items.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2"
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex gap-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="all">All Items</option>
              <option value="counted">Counted Items</option>
              <option value="variances">Items with Variances</option>
              <option value="stock_issues">Stock Issues</option>
            </select>
          </div>
        </CardHeader>

        {showDetails && (
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Details</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Min/Max</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.item_name}</div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {item.item_sku && <div>SKU: {item.item_sku}</div>}
                            {item.item_barcode && <div>Barcode: {item.item_barcode}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {item.location || 'Not specified'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.category_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {item.minimum_threshold && (
                            <div>Min: {item.minimum_threshold}</div>
                          )}
                          {item.maximum_threshold && (
                            <div>Max: {item.maximum_threshold}</div>
                          )}
                          {!item.minimum_threshold && !item.maximum_threshold && (
                            <div className="text-muted-foreground">Not set</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-mono">
                          {item.in_stock_quantity}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-mono">
                          {item.actual_quantity ?? '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={cn(
                          "font-mono font-medium",
                          getVarianceColor(item.variance_quantity)
                        )}>
                          {item.variance_quantity > 0 && '+'}
                          {item.variance_quantity.toFixed(0)}
                        </div>
                        {Math.abs(item.variance_quantity) > 0.01 && (
                          <div className="text-xs text-orange-600">
                            {formatCurrency(item.variance_cost)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          {formatCurrency(item.total_value)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @{formatCurrency(item.unit_cost || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge 
                            variant={getStockStatusColor(item.stock_status)}
                            className="text-xs"
                          >
                            {item.stock_status === 'normal' && 'Good Stock'}
                            {item.stock_status === 'low' && 'Low Stock'}
                            {item.stock_status === 'out' && 'Out of Stock'}
                            {item.stock_status === 'over' && 'Overstock'}
                          </Badge>
                          {item.actual_quantity === null && (
                            <Badge variant="secondary" className="text-xs">
                              Not Counted
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredItems.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">
                  No items match the current filters
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};