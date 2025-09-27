import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, Package, AlertCircle, Calendar } from 'lucide-react';
import { inventoryLotsApi, InventoryLot } from '@/contexts/inventory/api/inventoryLots';
import { inventoryItemsApi } from '@/contexts/inventory/api/inventoryItems';
import { inventoryTransactionsApi } from '@/contexts/inventory/api/inventoryTransactions';
import { toast } from 'sonner';
import { warehouseApi, type WarehouseItem } from '@/contexts/warehouse/api/warehouseApi';
import { format, parseISO } from 'date-fns';

interface OutgoingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItemId?: string | null;
  warehouseId?: string;
}

const withdrawalReasons = [
  { value: 'sale', label: 'Sale' },
  { value: 'internal_use', label: 'Internal Use' },
  { value: 'waste', label: 'Waste/Spoilage' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'expired', label: 'Expired' },
  { value: 'other', label: 'Other' }
];

export const OutgoingDialog: React.FC<OutgoingDialogProps> = ({
  open,
  onOpenChange,
  selectedItemId,
  warehouseId
}) => {
  const [loading, setLoading] = useState(false);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WarehouseItem | null>(null);
  const [availableLots, setAvailableLots] = useState<InventoryLot[]>([]);
  const [formData, setFormData] = useState({
    item_id: selectedItemId || '',
    quantity: 0,
    reason: '',
    unit_price: 0,
    customer_name: '',
    notes: ''
  });

  // Load warehouse items when dialog opens or warehouse changes
  useEffect(() => {
    if (open && warehouseId) {
      loadWarehouseItems();
    }
  }, [open, warehouseId]);

  useEffect(() => {
    if (selectedItemId) {
      const item = warehouseItems.find(i => i.item_id === selectedItemId);
      setSelectedItem(item || null);
      setFormData(prev => ({ ...prev, item_id: selectedItemId }));
      loadAvailableLots(selectedItemId);
    }
  }, [selectedItemId, warehouseItems]);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        item_id: '',
        quantity: 0,
        reason: '',
        unit_price: 0,
        customer_name: '',
        notes: ''
      });
      setSelectedItem(null);
      setAvailableLots([]);
      setWarehouseItems([]);
    }
  }, [open]);

  const loadWarehouseItems = async () => {
    if (!warehouseId) return;
    
    try {
      const items = await warehouseApi.listWarehouseItems(warehouseId);
      // Only show items with stock available
      const itemsWithStock = items.filter(item => item.on_hand > 0);
      setWarehouseItems(itemsWithStock);
    } catch (error) {
      console.error('Error loading warehouse items:', error);
      toast.error('Failed to load warehouse stock');
    }
  };

  const loadAvailableLots = async (itemId: string) => {
    try {
      const lots = await inventoryLotsApi.getByItemId(itemId);
      // Only show lots with remaining quantity > 0
      const availableLots = lots.filter(lot => lot.quantity_remaining > 0);
      setAvailableLots(availableLots);
    } catch (error) {
      console.error('Error loading lots:', error);
      toast.error('Failed to load lot information');
    }
  };

  const handleItemSelect = (itemId: string) => {
    const item = warehouseItems.find(i => i.item_id === itemId);
    setSelectedItem(item || null);
    setFormData(prev => ({ ...prev, item_id: itemId }));
    loadAvailableLots(itemId);
  };

  const isExpiringSoon = (expirationDate: string | null) => {
    if (!expirationDate) return false;
    const expDate = parseISO(expirationDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expirationDate: string | null) => {
    if (!expirationDate) return false;
    const expDate = parseISO(expirationDate);
    return expDate < new Date();
  };

  const calculateFIFOConsumption = (requestedQuantity: number) => {
    // Sort lots by expiration date (FIFO - First In, First Out)
    // For expired items, prioritize by most expired first
    const sortedLots = [...availableLots].sort((a, b) => {
      // If both have expiration dates
      if (a.expiration_date && b.expiration_date) {
        return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
      }
      // If only one has expiration date, prioritize the one with expiration date
      if (a.expiration_date && !b.expiration_date) return -1;
      if (!a.expiration_date && b.expiration_date) return 1;
      // If neither has expiration date, sort by creation date (older first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const consumption = [];
    let remainingQuantity = requestedQuantity;

    for (const lot of sortedLots) {
      if (remainingQuantity <= 0) break;
      
      const consumeFromThisLot = Math.min(remainingQuantity, lot.quantity_remaining);
      if (consumeFromThisLot > 0) {
        consumption.push({
          lotId: lot.id,
          lotNumber: lot.lot_number,
          quantity: consumeFromThisLot,
          remainingAfter: lot.quantity_remaining - consumeFromThisLot
        });
        remainingQuantity -= consumeFromThisLot;
      }
    }

    return { consumption, insufficientStock: remainingQuantity > 0 };
  };

  const handleWithdraw = async () => {
    try {
      if (!formData.item_id || !formData.reason || formData.quantity <= 0) {
        toast.error('Please select an item, reason, and enter quantity');
        return;
      }

      const { consumption, insufficientStock } = calculateFIFOConsumption(formData.quantity);
      
      if (insufficientStock) {
        toast.error('Insufficient stock available. Please check available lots.');
        return;
      }

      setLoading(true);

      // Update lot quantities based on FIFO consumption
      for (const consume of consumption) {
        await inventoryLotsApi.update(consume.lotId, {
          quantity_remaining: consume.remainingAfter
        });
      }

      // Update warehouse stock
      if (selectedItem && warehouseId) {
        const newStock = Math.max(0, selectedItem.on_hand - formData.quantity);
        // TODO: Add warehouse stock update API call
        console.log('Need to update warehouse stock:', { warehouseId, itemId: selectedItem.item_id, newStock });
      }

      // Create transaction record
      await inventoryTransactionsApi.create({
        organization_id: '', // Will be set by RLS
        item_id: formData.item_id,
        transaction_type: 'out',
        quantity: -formData.quantity, // Negative for outgoing
        unit_cost: formData.unit_price || undefined,
        transaction_date: new Date().toISOString(),
        reference_number: null,
        notes: `${formData.reason}${formData.customer_name ? ` - ${formData.customer_name}` : ''}${formData.notes ? ` - ${formData.notes}` : ''}`,
        user_id: '' // Will be set by auth
      });

      await loadWarehouseItems(); // Refresh warehouse items instead
      
      const reasonLabel = withdrawalReasons.find(r => r.value === formData.reason)?.label;
      toast.success(`Successfully withdrew ${formData.quantity} units of ${selectedItem?.item?.name} (${reasonLabel})`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error withdrawing stock:', error);
      toast.error('Failed to withdraw stock');
    } finally {
      setLoading(false);
    }
  };

  const totalAvailableStock = selectedItem ? selectedItem.on_hand : 0;
  const { consumption } = formData.quantity > 0 ? calculateFIFOConsumption(formData.quantity) : { consumption: [] };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Withdraw/Sell Warehouse Stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Item *</Label>
                <Select onValueChange={handleItemSelect} value={formData.item_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item to withdraw" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseItems.map((warehouseItem) => (
                      <SelectItem key={warehouseItem.item_id} value={warehouseItem.item_id}>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>{warehouseItem.item?.name}</span>
                          {warehouseItem.item?.sku && <span className="text-muted-foreground text-xs">({warehouseItem.item.sku})</span>}
                          <Badge variant="outline" className="text-xs">
                            {warehouseItem.on_hand} in warehouse
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedItem && (
                  <div className="mt-2 p-2 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium">{selectedItem.item?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Warehouse Stock: {selectedItem.on_hand} | Available in {availableLots.length} lots
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Lots */}
          {selectedItem && availableLots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Lots (FIFO Order)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lot Number</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Will Consume</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableLots
                        .sort((a, b) => {
                          if (a.expiration_date && b.expiration_date) {
                            return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
                          }
                          if (a.expiration_date && !b.expiration_date) return -1;
                          if (!a.expiration_date && b.expiration_date) return 1;
                          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                        })
                        .map((lot) => {
                          const consumeAmount = consumption.find(c => c.lotId === lot.id)?.quantity || 0;
                          return (
                            <TableRow key={lot.id}>
                              <TableCell className="font-medium">{lot.lot_number}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {lot.expiration_date ? (
                                    <>
                                      {format(parseISO(lot.expiration_date), 'MMM dd, yyyy')}
                                      {isExpired(lot.expiration_date) && (
                                        <Badge variant="destructive" className="text-xs">
                                          <AlertCircle className="h-3 w-3 mr-1" />
                                          Expired
                                        </Badge>
                                      )}
                                      {!isExpired(lot.expiration_date) && isExpiringSoon(lot.expiration_date) && (
                                        <Badge variant="secondary" className="text-xs">
                                          <Calendar className="h-3 w-3 mr-1" />
                                          Soon
                                        </Badge>
                                      )}
                                    </>
                                  ) : (
                                    'No expiration'
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{lot.quantity_remaining}</TableCell>
                              <TableCell>
                                {consumeAmount > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    -{consumeAmount}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">Available</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Withdrawal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Withdrawal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity to Withdraw *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    max={totalAvailableStock}
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max available: {totalAvailableStock}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {withdrawalReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit-price">Unit Price (for sales)</Label>
                  <Input
                    id="unit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {formData.reason === 'sale' && (
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer Name</Label>
                  <Input
                    id="customer"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="Customer or buyer name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>

              {formData.unit_price > 0 && formData.quantity > 0 && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm font-medium">
                    Total Value: ${(formData.unit_price * formData.quantity).toFixed(2)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleWithdraw} 
              disabled={loading || !formData.item_id || !formData.reason || formData.quantity <= 0 || formData.quantity > totalAvailableStock}
            >
              {loading ? 'Processing...' : 'Withdraw Stock'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};