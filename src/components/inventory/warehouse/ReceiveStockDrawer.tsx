import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, Truck, X, Package } from 'lucide-react';
import { toast } from 'sonner';
import { warehouseApi, type Warehouse } from '@/contexts/warehouse/api/warehouseApi';
import { ItemSelector, type InventoryItemOption } from '@/components/warehouse/ItemSelector';

interface ReceiveLine {
  id: string;
  item_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  qty: number;
  unit_cost?: number;
  line_notes?: string;
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
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<ReceiveLine[]>([]);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load warehouse when warehouseId changes
  useEffect(() => {
    if (warehouseId && open) {
      loadWarehouse();
    }
  }, [warehouseId, open]);

  const loadWarehouse = async () => {
    if (!warehouseId) return;
    try {
      const warehouseData = await warehouseApi.getPrimaryWarehouse();
      setWarehouse(warehouseData);
    } catch (error) {
      console.error('Error loading warehouse:', error);
      toast.error('Failed to load warehouse details');
    }
  };

  const handleItemSelect = (item: InventoryItemOption) => {
    // Check if item already exists in lines
    const existingLine = lineItems.find(line => line.item_id === item.id);
    if (existingLine) {
      toast.error('Item already added to this receipt');
      return;
    }

    const newLine: ReceiveLine = {
      id: Date.now().toString(),
      item_id: item.id,
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      qty: 1,
      unit_cost: item.unit_cost,
      line_notes: ''
    };

    setLineItems([...lineItems, newLine]);
    setShowItemSelector(false);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof ReceiveLine, value: string | number) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((total, item) => {
      const cost = item.unit_cost || 0;
      return total + (item.qty * cost);
    }, 0);
  };

  const handleSubmit = async () => {
    if (!warehouseId) {
      toast.error('No warehouse selected');
      return;
    }

    const validLines = lineItems.filter(item => item.qty > 0);
    if (validLines.length === 0) {
      toast.error('Please add at least one item with quantity > 0');
      return;
    }

    try {
      setSubmitting(true);

      // Step 1: Create receipt
      const receipt = await warehouseApi.createReceipt(warehouseId, reference || undefined);

      // Step 2: Add lines to receipt
      for (const line of validLines) {
        if (line.unit_cost && line.unit_cost > 0) {
          await warehouseApi.addReceiptLine(receipt.id, {
            itemId: line.item_id,
            qty: line.qty,
            unitCost: line.unit_cost
          });
        }
      }

      // Step 3: Post the receipt (this updates warehouse_items.on_hand)
      await warehouseApi.postReceipt(receipt.id);

      toast.success(`Receipt ${receipt.id.slice(0, 8)} posted successfully!`);
      
      // Reset form
      resetForm();
      setOpen(false);
      
      // Trigger refresh of warehouse stock
      if (onReceiptPosted) {
        onReceiptPosted();
      }
    } catch (error) {
      console.error('Error posting receipt:', error);
      toast.error('Failed to post receipt. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setReference('');
    setNotes('');
    setLineItems([]);
    setReceivedDate(new Date().toISOString().split('T')[0]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Receive from Master List
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-4xl">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Receive Stock
              </DrawerTitle>
              <DrawerDescription>
                Select items from master list and record quantities received
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-4 space-y-6">
              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Warehouse</Label>
                  <Input
                    value={warehouse?.name || 'Loading...'}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receivedDate">Received Date</Label>
                  <Input
                    id="receivedDate"
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference (optional)</Label>
                  <Input
                    id="reference"
                    placeholder="PO number, invoice, etc."
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none"
                    rows={2}
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Items to Receive</Label>
                  <Button 
                    onClick={() => setShowItemSelector(true)} 
                    size="sm" 
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                {lineItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Items Added</h3>
                    <p className="text-muted-foreground mb-4">
                      Click "Add Item" to select items from your master list
                    </p>
                    <Button 
                      onClick={() => setShowItemSelector(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {lineItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                            {/* Item Info */}
                            <div className="lg:col-span-4">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground flex gap-2">
                                {item.sku && <span>SKU: {item.sku}</span>}
                                {item.barcode && <span>| {item.barcode}</span>}
                              </div>
                            </div>
                            
                            {/* Quantity */}
                            <div className="lg:col-span-2">
                              <Label className="text-xs">Quantity</Label>
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                placeholder="0"
                                value={item.qty || ''}
                                onChange={(e) => updateLineItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            
                            {/* Unit Cost */}
                            <div className="lg:col-span-2">
                              <Label className="text-xs">Unit Cost</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={item.unit_cost || ''}
                                onChange={(e) => updateLineItem(item.id, 'unit_cost', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            
                            {/* Line Total */}
                            <div className="lg:col-span-2 text-right">
                              <Label className="text-xs">Line Total</Label>
                              <div className="font-medium">
                                {formatCurrency((item.qty || 0) * (item.unit_cost || 0))}
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="lg:col-span-2 flex justify-end">
                              <Button
                                onClick={() => removeLineItem(item.id)}
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Subtotal */}
                    <div className="flex justify-end pt-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Subtotal</div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(calculateSubtotal())}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DrawerFooter>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1"
                  disabled={lineItems.length === 0 || submitting}
                >
                  {submitting ? 'Posting Receipt...' : 'Receive Items'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)} 
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Item Selector Modal */}
      <ItemSelector
        open={showItemSelector}
        onSelect={handleItemSelect}
        onClose={() => setShowItemSelector(false)}
      />
    </>
  );
};