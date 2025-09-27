import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Search, AlertTriangle, Hash, Barcode, DollarSign, Package2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { warehouseApi, type WarehouseItem } from '@/contexts/warehouse/api/warehouseApi';
import { toast } from 'sonner';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ItemDetailsModal } from '../ItemDetailsModal';
import { InventoryItem } from '@/contexts/inventory/types';
import { StockStatusBadge } from '../StockStatusBadge';
import { getStockStatusSummary } from '@/utils/stockStatus';

interface WarehouseStockProps {
  warehouseId?: string;
}

export const WarehouseStock: React.FC<WarehouseStockProps> = ({ warehouseId }) => {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const selectedItem = selectedItemId ? items.find(warehouseItem => warehouseItem.item_id === selectedItemId)?.item || null : null;

  // Convert warehouse item to inventory item format for modal
  const convertToInventoryItem = (warehouseItem: WarehouseItem) => {
    if (!warehouseItem.item) return null;
    
    return {
      ...warehouseItem.item,
      organization_id: '', // Will be filled by context
      current_stock: warehouseItem.on_hand,
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      purchase_price: null,
      unit_cost: warehouseItem.wac_unit_cost,
      conversion_factor: null,
      purchase_unit: null,
      minimum_threshold: warehouseItem.reorder_min || null,
      maximum_threshold: warehouseItem.reorder_max || null,
      reorder_point: null,
      location: null,
      is_active: true,
      is_template: false,
      sort_order: 0,
      team_id: null,
      vendor_id: null,
      vendor: null
    } as InventoryItem;
  };

  const modalItem = selectedItemId ? 
    convertToInventoryItem(items.find(warehouseItem => warehouseItem.item_id === selectedItemId)!) : 
    null;

  useEffect(() => {
    if (!warehouseId) {
      setLoading(false);
      return;
    }
    
    loadWarehouseItems();
  }, [warehouseId, search]);

  const loadWarehouseItems = async () => {
    if (!warehouseId) return;
    
    try {
      setLoading(true);
      const data = await warehouseApi.listWarehouseItems(warehouseId, search);
      // Sort items by name on client-side since we can't order by joined fields in PostgREST
      const sortedData = [...data].sort((a, b) => {
        const nameA = a.item?.name || '';
        const nameB = b.item?.name || '';
        return nameA.localeCompare(nameB);
      });
      setItems(sortedData);
    } catch (error) {
      console.error('Error loading warehouse items:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to load warehouse stock: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const formatQuantity = (qty: number) => {
    return formatNumber(qty);
  };

  const handleItemClick = (itemId: string) => {
    const item = items.find(warehouseItem => warehouseItem.item_id === itemId);
    if (item?.item) {
      setSelectedItemId(itemId);
      setIsDetailsModalOpen(true);
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!items.length) {
      return {
        totalItems: 0,
        totalSKUs: 0,
        totalBarcodes: 0,
        totalStockValue: 0,
        stockStatus: {
          underStock: 0,
          overStock: 0,
          normalStock: 0,
          noThresholds: 0,
          total: 0
        }
      };
    }

    const totalItems = items.length;
    const totalSKUs = items.filter(item => item.item?.sku).length;
    const totalBarcodes = items.filter(item => item.item?.barcode).length;
    const totalStockValue = items.reduce((sum, item) => {
      return sum + (Number(item.on_hand) * Number(item.wac_unit_cost));
    }, 0);

    // Calculate stock status summary
    const stockStatusItems = items.map(item => ({
      actualQuantity: item.on_hand,
      minimumThreshold: item.reorder_min,
      maximumThreshold: item.reorder_max,
      templateMinimum: null,
      templateMaximum: null
    }));

    const stockStatus = getStockStatusSummary(stockStatusItems);

    return {
      totalItems,
      totalSKUs,
      totalBarcodes,
      totalStockValue,
      stockStatus
    };
  }, [items]);

  if (!warehouseId) {
    return null; // WarehouseTab now handles the not configured state
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Warehouse Stock
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search items..." 
                className="pl-10 w-full sm:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading warehouse stock...</div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Stock Items</h3>
            <p className="text-muted-foreground max-w-md">
              {search ? 'No items match your search criteria.' : 'No items in warehouse stock yet. Start by receiving inventory.'}
            </p>
          </div>
        ) : (
          <>
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Package2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                      <p className="text-2xl font-bold">{formatNumber(summaryStats.totalItems)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Hash className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total SKUs</p>
                      <p className="text-2xl font-bold">{formatNumber(summaryStats.totalSKUs)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Barcode className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Barcodes</p>
                      <p className="text-2xl font-bold">{formatNumber(summaryStats.totalBarcodes)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <DollarSign className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Stock Value</p>
                      <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalStockValue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stock Status Summary */}
            {summaryStats.stockStatus.total > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-destructive/10">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Under Stock</p>
                        <p className="text-2xl font-bold text-destructive">{summaryStats.stockStatus.underStock}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <Package className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Over Stock</p>
                        <p className="text-2xl font-bold text-orange-600">{summaryStats.stockStatus.overStock}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Package className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Normal Stock</p>
                        <p className="text-2xl font-bold text-green-600">{summaryStats.stockStatus.normalStock}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-muted/5 to-muted/10 border-muted/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/10">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">No Thresholds</p>
                        <p className="text-2xl font-bold">{summaryStats.stockStatus.noThresholds}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="text-right">In Stock</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Reorder Min</TableHead>
                  <TableHead className="text-right">Reorder Max</TableHead>
                  <TableHead className="text-center">Stock Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={`${item.warehouse_id}-${item.item_id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => handleItemClick(item.item_id)}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.item?.name}</div>
                        {item.item?.category && (
                          <div className="text-sm text-muted-foreground">
                            {item.item.category.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1 py-0.5 rounded">
                        {item.item?.sku || '-'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1 py-0.5 rounded">
                        {item.item?.barcode || '-'}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        {formatQuantity(item.on_hand)}
                      </div>
                      {item.item?.base_unit && (
                        <div className="text-sm text-muted-foreground">
                          {item.item.base_unit.abbreviation}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.wac_unit_cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.reorder_min ? formatQuantity(item.reorder_min) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.reorder_max ? formatQuantity(item.reorder_max) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <StockStatusBadge
                        actualQuantity={item.on_hand}
                        minimumThreshold={item.reorder_min}
                        maximumThreshold={item.reorder_max}
                        size="sm"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </>
        )}
      </CardContent>

      <ItemDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        item={modalItem}
      />
    </Card>
  );
};