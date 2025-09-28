import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MinusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from '@/contexts/warehouse/WarehouseContext';

interface StockWithdrawalDrawerProps {
  warehouseId: string;
  onWithdrawalSuccess?: () => void;
}

export const StockWithdrawalDrawer: React.FC<StockWithdrawalDrawerProps> = ({
  warehouseId,
  onWithdrawalSuccess
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');

  const { warehouseItems, forceRefresh } = useWarehouse();

  // Filter items for the current warehouse that have stock
  const availableItems = warehouseItems.filter(item => 
    item.warehouse_id === warehouseId && item.on_hand > 0
  );

  const selectedItem = availableItems.find(item => item.item_id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItemId || !quantity || Number(quantity) <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedItem && Number(quantity) > selectedItem.on_hand) {
      toast.error(`Insufficient stock. Available: ${selectedItem.on_hand}`);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.rpc('create_warehouse_withdrawal', {
        p_warehouse_id: warehouseId,
        p_item_id: selectedItemId,
        p_quantity: Number(quantity),
        p_reason: reason || 'Stock withdrawal',
        p_reference: reference || null
      });

      if (error) throw error;

      toast.success('Stock withdrawal recorded successfully');
      
      // Reset form
      setSelectedItemId('');
      setQuantity('');
      setReason('');
      setReference('');
      setIsOpen(false);

      // Refresh data
      await forceRefresh();
      onWithdrawalSuccess?.();

    } catch (error: any) {
      console.error('Error recording withdrawal:', error);
      toast.error(error.message || 'Failed to record withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <MinusCircle className="h-4 w-4 mr-2" />
          Withdraw Stock
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Withdraw Stock</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="item">Item *</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {availableItems.map((item) => (
                  <SelectItem key={item.item_id} value={item.item_id}>
                    {item.item?.name} (Available: {item.on_hand})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedItem && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                Available Stock: <span className="font-medium">{selectedItem.on_hand}</span>
              </p>
              {selectedItem.reorder_min && selectedItem.on_hand <= selectedItem.reorder_min && (
                <p className="text-sm text-orange-600">
                  ⚠️ Stock is at or below reorder point ({selectedItem.reorder_min})
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0.01"
              max={selectedItem?.on_hand || undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity to withdraw"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Production use, Sale, Damaged goods"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., Work Order #, Sales Order #"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading || !selectedItemId || !quantity}
              className="flex-1"
            >
              {isLoading ? 'Recording...' : 'Record Withdrawal'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};