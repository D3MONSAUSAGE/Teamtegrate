import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Package } from 'lucide-react';
import { InventoryItem, InventoryCountItem } from '@/contexts/inventory/types';

interface ScanItemPickerProps {
  open: boolean;
  onClose: () => void;
  items: InventoryItem[];
  countItems: InventoryCountItem[];
  onItemSelect: (item: InventoryItem) => void;
  selectedItemId?: string;
}

export const ScanItemPicker: React.FC<ScanItemPickerProps> = ({
  open,
  onClose,
  items,
  countItems,
  onItemSelect,
  selectedItemId
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Feature flag for scope enforcement
  const enforceCountScope = process.env.NODE_ENV === 'development' || 
    localStorage.getItem('features.enforceCountScope') === 'true';

  // Build items list - either from countItems only (scoped) or all items (legacy)
  const sourceItems = enforceCountScope 
    ? countItems.map(ci => ci.item).filter(Boolean) as InventoryItem[]
    : items;

  // Filter items based on search term
  const filteredItems = sourceItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get count item data for each inventory item
  const getItemStatus = (item: InventoryItem) => {
    const countItem = countItems.find(ci => ci.item_id === item.id);
    const actualQty = countItem?.actual_quantity;
    const inStock = countItem?.in_stock_quantity ?? item.current_stock ?? 0;
    const min = countItem?.template_minimum_quantity ?? item.minimum_threshold;
    const max = countItem?.template_maximum_quantity ?? item.maximum_threshold;
    
    return {
      actualQty,
      inStock,
      min,
      max,
      isCounted: actualQty !== null && actualQty !== undefined,
      countItem
    };
  };

  const handleItemClick = (item: InventoryItem) => {
    onItemSelect(item);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Item to Count
          </SheetTitle>
          <SheetDescription>
            Choose an item to start scanning. Items in this count only.
            {enforceCountScope && (
              <span className="block text-xs mt-1 font-medium text-primary">
                🔒 Scoped to count items only ({sourceItems.length} available)
              </span>
            )}
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-4 mt-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Items List */}
          <ScrollArea className="h-[60vh]">
            <div className="space-y-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items found</p>
                  {searchTerm && (
                    <p className="text-sm">Try adjusting your search terms</p>
                  )}
                </div>
              ) : (
                filteredItems.map((item) => {
                  const status = getItemStatus(item);
                  const isSelected = selectedItemId === item.id;
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isSelected ? "default" : "ghost"}
                      className="w-full h-auto p-4 justify-start"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium truncate">{item.name}</h4>
                          <Badge 
                            variant={status.isCounted ? "default" : "secondary"}
                            className="ml-2 shrink-0"
                          >
                            {status.isCounted ? "Counted" : "Pending"}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.sku ? `SKU: ${item.sku}` : 'No SKU'}
                          {item.barcode && ` • Barcode: ${item.barcode}`}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Min:</span> {status.min ?? '—'}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max:</span> {status.max ?? '—'}
                          </div>
                          <div>
                            <span className="text-muted-foreground">In-Stock:</span> {status.inStock}
                          </div>
                          {status.isCounted && (
                            <div className="font-medium">
                              <span className="text-muted-foreground">Actual:</span> {status.actualQty}
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};