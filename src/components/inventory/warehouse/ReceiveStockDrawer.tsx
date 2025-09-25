import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Truck } from 'lucide-react';
import { toast } from 'sonner';

interface LineItem {
  id: string;
  item: string;
  quantity: number;
  unitCost: number;
}

interface ReceiveStockDrawerProps {
  warehouseId?: string;
  onReceiptPosted?: () => void;
}

export const ReceiveStockDrawer: React.FC<ReceiveStockDrawerProps> = ({ 
  warehouseId, 
  onReceiptPosted 
}) => {
  const [open, setOpen] = useState(false);
  const [vendor, setVendor] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', item: '', quantity: 0, unitCost: 0 }
  ]);

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      item: '',
      quantity: 0,
      unitCost: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async () => {
    if (!vendor.trim()) {
      toast.error('Please enter a vendor name');
      return;
    }

    const validItems = lineItems.filter(item => item.item.trim() && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    try {
      // For now, show a success message as this is a UI demonstration
      toast.success('Receipt posted successfully');
      
      // Reset form
      setVendor('');
      setLineItems([{ id: '1', item: '', quantity: 0, unitCost: 0 }]);
      setOpen(false);
      
      // Trigger refresh of warehouse stock
      if (onReceiptPosted) {
        onReceiptPosted();
      }
    } catch (error) {
      console.error('Error posting receipt:', error);
      toast.error('Failed to post receipt');
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Receive Stock
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Receive Stock
            </DrawerTitle>
            <DrawerDescription>
              Record incoming inventory from vendors
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                placeholder="Enter vendor name"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button onClick={addLineItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lineItems.map((item, index) => (
                  <Card key={item.id}>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-5">
                          <Input
                            placeholder="Item name"
                            value={item.item}
                            onChange={(e) => updateLineItem(item.id, 'item', e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Input
                            type="number"
                            placeholder="Quantity"
                            value={item.quantity || ''}
                            onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Unit Cost"
                            value={item.unitCost || ''}
                            onChange={(e) => updateLineItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="sm:col-span-1 flex justify-center">
                          <Button
                            onClick={() => removeLineItem(item.id)}
                            size="sm"
                            variant="ghost"
                            disabled={lineItems.length === 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DrawerFooter>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleSubmit} className="flex-1">
                Post Receipt
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};