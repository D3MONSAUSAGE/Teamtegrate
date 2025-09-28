import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ItemDetailsModal } from '../ItemDetailsModal';
import { InventoryItem } from '@/contexts/inventory/types';
import { StockStatusBadge } from '../StockStatusBadge';
import { getStockStatusSummary } from '@/utils/stockStatus';
import { useWarehouse } from '@/contexts/warehouse/WarehouseContext';
import { type WarehouseItem } from '@/contexts/warehouse/api/warehouseApi';
import { WarehouseSettingsApi } from '@/contexts/warehouse/api/warehouseSettingsApi';

interface WarehouseStockProps {
  warehouseId?: string;
  onRefresh?: () => void;
}

export const WarehouseStock: React.FC<WarehouseStockProps> = ({ warehouseId, onRefresh }) => {
  // Use warehouse context for centralized state management
  const { warehouseItems, itemsLoading } = useWarehouse();
  const [search, setSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [thresholds, setThresholds] = useState<Map<string, { min: number | null; max: number | null }>>(new Map());
  
  // Warehouse settings API instance
  const settingsApi = useMemo(() => new WarehouseSettingsApi(), []);

  // Load warehouse settings for current day
  useEffect(() => {
    if (!warehouseId) return;
    
    const loadThresholds = async () => {
      try {
        // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
        const today = new Date().getDay();
        const settings = await settingsApi.getWarehouseSettings(warehouseId);
        
        // Create threshold map with priority: Daily Settings → Warehouse Defaults
        const thresholdMap = new Map<string, { min: number | null; max: number | null }>();
        
        // First, set warehouse defaults from warehouse_items
        warehouseItems.forEach(item => {
          thresholdMap.set(item.item_id, {
            min: item.reorder_min || null,
            max: item.reorder_max || null
          });
        });
        
        // Then override with daily settings for today
        settings
          .filter(setting => setting.day_of_week === today)
          .forEach(setting => {
            thresholdMap.set(setting.item_id, {
              min: setting.reorder_min || null,
              max: setting.reorder_max || null
            });
          });
        
        setThresholds(thresholdMap);
      } catch (error) {
        console.error('Failed to load warehouse thresholds:', error);
      }
    };

    loadThresholds();
  }, [warehouseId, warehouseItems, settingsApi]);

  // Filter items based on search
  const items = useMemo(() => {
    if (!search.trim()) return warehouseItems;
    
    const searchLower = search.toLowerCase();
    return warehouseItems.filter(item => 
      item.item?.name?.toLowerCase().includes(searchLower) ||
      item.item?.sku?.toLowerCase().includes(searchLower) ||
      item.item?.barcode?.toLowerCase().includes(searchLower)
    );
  }, [warehouseItems, search]);

  // Convert warehouse item to inventory item format for modal
  const convertToInventoryItem = (warehouseItem: WarehouseItem) => {
    if (!warehouseItem.item) return null;
    
    return {
      ...warehouseItem.item,
      organization_id: '',
      current_stock: warehouseItem.on_hand,
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      purchase_price: null,
      unit_cost: warehouseItem.item?.unit_cost || 0,
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
      return sum + (Number(item.on_hand) * Number(item.item?.unit_cost || 0));
    }, 0);

    const stockStatusItems = items.map(item => {
      const itemThresholds = thresholds.get(item.item_id);
      return {
        actualQuantity: item.on_hand,
        minimumThreshold: itemThresholds?.min || null,
        maximumThreshold: itemThresholds?.max || null,
        templateMinimum: null,
        templateMaximum: null
      };
    });

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
    return null;
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
        {itemsLoading ? (
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
                          {formatNumber(item.on_hand)}
                        </div>
                        {item.item?.base_unit && (
                          <div className="text-sm text-muted-foreground">
                            {item.item.base_unit.abbreviation}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.item?.unit_cost || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {(() => {
                          const itemThresholds = thresholds.get(item.item_id);
                          const min = itemThresholds?.min;
                          return min ? formatNumber(min) : '-';
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        {(() => {
                          const itemThresholds = thresholds.get(item.item_id);
                          const max = itemThresholds?.max;
                          return max ? formatNumber(max) : '-';
                        })()}
                      </TableCell>
                      <TableCell className="text-center">
                        {(() => {
                          const itemThresholds = thresholds.get(item.item_id);
                          return (
                            <StockStatusBadge
                              actualQuantity={item.on_hand}
                              minimumThreshold={itemThresholds?.min || null}
                              maximumThreshold={itemThresholds?.max || null}
                              size="sm"
                            />
                          );
                        })()}
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