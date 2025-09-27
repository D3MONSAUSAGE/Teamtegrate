import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TruckIcon, QrCode, Calendar } from 'lucide-react';
import { inventoryLotsApi } from '@/contexts/inventory/api/inventoryLots';
import { inventoryItemsApi } from '@/contexts/inventory/api/inventoryItems';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { toast } from 'sonner';
import { useInventory } from '@/contexts/inventory';
import { ShipmentSelector } from './receiving/ShipmentSelector';
import { shipmentsApi, Shipment } from '@/contexts/inventory/api/shipments';

interface ReceivingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItemId?: string | null;
}

export const ReceivingDialog: React.FC<ReceivingDialogProps> = ({
  open,
  onOpenChange,
  selectedItemId
}) => {
  const { items, refreshItems } = useInventory();
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [formData, setFormData] = useState({
    item_id: selectedItemId || '',
    lot_number: '',
    manufacturing_date: '',
    expiration_date: '',
    quantity_received: 0,
    cost_per_unit: 0,
    supplier_info: {
      name: '',
      contact: '',
      po_number: ''
    },
    notes: ''
  });

  useEffect(() => {
    if (selectedItemId) {
      const item = items.find(i => i.id === selectedItemId);
      setSelectedItem(item);
      setFormData(prev => ({ ...prev, item_id: selectedItemId }));
    }
  }, [selectedItemId, items]);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        item_id: '',
        lot_number: '',
        manufacturing_date: '',
        expiration_date: '',
        quantity_received: 0,
        cost_per_unit: 0,
        supplier_info: {
          name: '',
          contact: '',
          po_number: ''
        },
        notes: ''
      });
      setSelectedItem(null);
      setSelectedShipment(null);
    }
  }, [open]);

  const handleItemSelect = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    setSelectedItem(item);
    setFormData(prev => ({ ...prev, item_id: itemId }));
  };

  const generateLotNumber = () => {
    if (selectedShipment) {
      // Generate shipment-based lot number
      const date = new Date(selectedShipment.received_date).toISOString().split('T')[0].replace(/-/g, '');
      const shipmentCode = selectedShipment.shipment_number.replace('SHIP-', '').replace(/-/g, '');
      const lotNumber = `${shipmentCode}-${date}`;
      setFormData(prev => ({ ...prev, lot_number: lotNumber }));
    } else {
      // Fallback to generic lot number
      const lotNumber = BarcodeGenerator.generateLotNumber('LOT');
      setFormData(prev => ({ ...prev, lot_number: lotNumber }));
    }
  };

  const handleReceiveStock = async () => {
    try {
      if (!formData.item_id || !formData.lot_number || formData.quantity_received <= 0) {
        toast.error('Please select an item, provide lot number and quantity received');
        return;
      }

      setLoading(true);

      // Create lot record
      await inventoryLotsApi.create({
        organization_id: '', // Will be set by RLS
        item_id: formData.item_id,
        lot_number: formData.lot_number,
        manufacturing_date: formData.manufacturing_date || null,
        expiration_date: formData.expiration_date || null,
        quantity_received: formData.quantity_received,
        quantity_remaining: formData.quantity_received,
        cost_per_unit: formData.cost_per_unit || null,
        supplier_info: selectedShipment?.supplier_info || formData.supplier_info,
        notes: formData.notes || null,
        is_active: true,
        created_by: '', // Will be set by auth
        shipment_id: selectedShipment?.id || null
      });

      // Update item stock
      if (selectedItem) {
        const newStock = (selectedItem.current_stock || 0) + formData.quantity_received;
        await inventoryItemsApi.updateStock(selectedItem.id, newStock);
      }

      await refreshItems();
      toast.success(`Successfully received ${formData.quantity_received} units of ${selectedItem?.name}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error receiving stock:', error);
      toast.error('Failed to receive stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-primary" />
            Receive Stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shipment Selection */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Shipment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ShipmentSelector 
                selectedShipmentId={selectedShipment?.id}
                onShipmentSelect={(shipment) => {
                  setSelectedShipment(shipment);
                  if (shipment) {
                    // Auto-generate lot number when shipment is selected
                    const date = new Date(shipment.received_date).toISOString().split('T')[0].replace(/-/g, '');
                    const shipmentCode = shipment.shipment_number.replace('SHIP-', '').replace(/-/g, '');
                    const lotNumber = `${shipmentCode}-${date}`;
                    setFormData(prev => ({ 
                      ...prev, 
                      lot_number: lotNumber,
                      supplier_info: shipment.supplier_info || prev.supplier_info
                    }));
                  }
                }}
              />
              {selectedShipment && (
                <div className="mt-3 p-3 bg-background rounded-md border">
                  <div className="text-sm font-medium text-primary">
                    {selectedShipment.shipment_number}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Received: {new Date(selectedShipment.received_date).toLocaleDateString()}
                  </div>
                  {selectedShipment.supplier_info?.name && (
                    <div className="text-xs text-muted-foreground">
                      Supplier: {selectedShipment.supplier_info.name}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

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
                    <SelectValue placeholder="Select item to receive" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>{item.name}</span>
                          {item.sku && <span className="text-muted-foreground text-xs">({item.sku})</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedItem && (
                  <div className="mt-2 p-2 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium">{selectedItem.name}</p>
                    <p className="text-xs text-muted-foreground">Current Stock: {selectedItem.current_stock || 0}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lot Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lot Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lot-number">Lot Number *</Label>
                <div className="flex gap-2">
                  <Input
                    id="lot-number"
                    value={formData.lot_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, lot_number: e.target.value }))}
                    placeholder="Enter lot number"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={generateLotNumber}>
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mfg-date">Manufacturing Date</Label>
                  <Input
                    id="mfg-date"
                    type="date"
                    value={formData.manufacturing_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, manufacturing_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-date">Expiration Date</Label>
                  <Input
                    id="exp-date"
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Received *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.quantity_received}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity_received: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost per Unit</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supplier Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier-name">Supplier Name</Label>
                  <Input
                    id="supplier-name"
                    value={formData.supplier_info.name}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      supplier_info: { ...prev.supplier_info, name: e.target.value }
                    }))}
                    placeholder="Supplier name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier-contact">Contact</Label>
                  <Input
                    id="supplier-contact"
                    value={formData.supplier_info.contact}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      supplier_info: { ...prev.supplier_info, contact: e.target.value }
                    }))}
                    placeholder="Phone or email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="po-number">Purchase Order Number</Label>
                <Input
                  id="po-number"
                  value={formData.supplier_info.po_number}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    supplier_info: { ...prev.supplier_info, po_number: e.target.value }
                  }))}
                  placeholder="PO number (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this receipt"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleReceiveStock} disabled={loading || !formData.item_id}>
              {loading ? 'Receiving...' : 'Receive Stock'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};