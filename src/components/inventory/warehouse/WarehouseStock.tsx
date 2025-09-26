import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Search, AlertTriangle } from 'lucide-react';
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

interface WarehouseStockProps {
  warehouseId?: string;
}

export const WarehouseStock: React.FC<WarehouseStockProps> = ({ warehouseId }) => {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatQuantity = (qty: number) => {
    return Number(qty).toLocaleString();
  };

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="text-right">On Hand</TableHead>
                  <TableHead className="text-right">WAC</TableHead>
                  <TableHead className="text-right">Reorder Min</TableHead>
                  <TableHead className="text-right">Reorder Max</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={`${item.warehouse_id}-${item.item_id}`}>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};