import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, Package, Search, Loader2 } from 'lucide-react';
import { useInventory } from '@/contexts/inventory';
import { warehouseApi } from '@/contexts/warehouse/api/warehouseApi';
import { toast } from 'sonner';

interface ReceiveStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  onSuccess?: () => void;
}

interface ReceiveItem {
  item_id: string;
  item_name: string;
  sku?: string;
  quantity: number;
  unit_cost: number;
}

export const ReceiveStockDialog: React.FC<ReceiveStockDialogProps> = ({
  open,
  onOpenChange,
  warehouseId,
  onSuccess
}) => {
  const { items: inventoryItems } = useInventory();
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter inventory items based on search
  const filteredItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.barcode && item.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addItem = (itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId);
    if (!item) return;

    const existingIndex = receiveItems.findIndex(ri => ri.item_id === itemId);
    
    if (existingIndex >= 0) {
      // Increment quantity if item already exists
      const updated = [...receiveItems];
      updated[existingIndex].quantity += 1;
      setReceiveItems(updated);
    } else {
      // Add new item
      setReceiveItems([...receiveItems, {
        item_id: itemId,
        item_name: item.name,
        sku: item.sku,
        quantity: 1,
        unit_cost: 0
      }]);
    }
    setSearchQuery('');
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 0) return;
    const updated = [...receiveItems];
    updated[index].quantity = quantity;
    setReceiveItems(updated);
  };

  const updateItemCost = (index: number, cost: number) => {
    if (cost < 0) return;
    const updated = [...receiveItems];
    updated[index].unit_cost = cost;
    setReceiveItems(updated);
  };

  const removeItem = (index: number) => {
    setReceiveItems(receiveItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (receiveItems.length === 0) {
      toast.error('Please add at least one item to receive');
      return;
    }

    // Validate all items have quantity > 0 and cost >= 0
    const invalidItems = receiveItems.filter(item => item.quantity <= 0);
    if (invalidItems.length > 0) {
      toast.error('All items must have quantity greater than 0');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare items for the API
      const items = receiveItems.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        notes: notes || 'Stock received'
      }));

      // Call the new receiveStock API
      await warehouseApi.receiveStock(warehouseId, items);

      toast.success(`Successfully received ${receiveItems.length} item${receiveItems.length !== 1 ? 's' : ''}!`);
      
      // Reset form
      setReceiveItems([]);
      setNotes('');
      setSearchQuery('');
      
      // Close dialog and trigger refresh
      onOpenChange(false);
      onSuccess?.();
      
    } catch (error) {
      console.error('Error receiving stock:', error);
      toast.error(`Failed to receive stock: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Receive Stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Items Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Items</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {filteredItems.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    onClick={() => addItem(item.id)}
                  >
                    <div className="font-medium">{item.name}</div>
                    {item.sku && <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>}
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <div className="p-3 text-muted-foreground text-center">No items found</div>
                )}
              </div>
            )}
          </div>

          {/* Selected Items */}
          {receiveItems.length > 0 && (
            <div className="space-y-4">
              <Label>Items to Receive</Label>
              <div className="space-y-3">
                {receiveItems.map((item, index) => (
                  <div key={item.item_id} className="flex items-center gap-3 p-3 border rounded-md">
                    <div className="flex-1">
                      <div className="font-medium">{item.item_name}</div>
                      {item.sku && <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(index, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                        className="w-20 text-center"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(index, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="Unit cost"
                        value={item.unit_cost}
                        onChange={(e) => updateItemCost(index, parseFloat(e.target.value) || 0)}
                        className="w-24"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Add any notes about this stock receipt..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || receiveItems.length === 0}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Receive {receiveItems.length} Item{receiveItems.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};