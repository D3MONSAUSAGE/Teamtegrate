import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Package } from 'lucide-react';
import { InventoryItem, InventoryCountItem } from '@/contexts/inventory/types';

interface ItemPickerSheetProps {
  open: boolean;
  onClose: () => void;
  items: InventoryItem[];
  countItems: InventoryCountItem[];
  onItemSelect: (item: InventoryItem) => void;
}

export const ItemPickerSheet: React.FC<ItemPickerSheetProps> = ({
  open,
  onClose,
  items,
  countItems,
  onItemSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.sku?.toLowerCase().includes(query) ||
      item.barcode?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Get count item data for each item
  const getItemData = (item: InventoryItem) => {
    const countItem = countItems.find(ci => ci.item_id === item.id);
    const minThreshold = countItem?.template_minimum_quantity ?? item.minimum_threshold;
    const maxThreshold = countItem?.template_maximum_quantity ?? item.maximum_threshold;
    const inStock = item.current_stock;
    const actualQty = countItem?.actual_quantity;
    const isCounted = actualQty !== null && actualQty !== undefined;
    
    return {
      countItem,
      minThreshold,
      maxThreshold,
      inStock,
      actualQty,
      isCounted
    };
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div 
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Select Item to Count</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search items by name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 min-h-[44px]"
              autoFocus
            />
          </div>
        </div>

        {/* Items List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No items found matching your search' : 'No items available'}
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const { minThreshold, maxThreshold, inStock, actualQty, isCounted } = getItemData(item);
                
                return (
                  <Card 
                    key={item.id} 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => onItemSelect(item)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {/* Item name and status */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.sku && `SKU: ${item.sku}`}
                              {item.sku && item.barcode && ' • '}
                              {item.barcode && `Barcode: ${item.barcode}`}
                            </p>
                          </div>
                          <Badge variant={isCounted ? "default" : "secondary"} className="ml-2">
                            {isCounted ? 'Counted' : 'Pending'}
                          </Badge>
                        </div>

                        {/* Mini row with Min/Max/In-Stock */}
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Min:</span> {minThreshold ?? '—'}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max:</span> {maxThreshold ?? '—'}
                          </div>
                          <div>
                            <span className="text-muted-foreground">In-Stock:</span> {inStock ?? '—'}
                          </div>
                          {isCounted && (
                            <div className="font-medium">
                              <span className="text-muted-foreground">Actual:</span> {actualQty}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};