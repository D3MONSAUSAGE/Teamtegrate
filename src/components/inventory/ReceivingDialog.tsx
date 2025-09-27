import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TruckIcon, Search, Trash2, Plus, Calendar, FileText } from 'lucide-react';
import { inventoryLotsApi } from '@/contexts/inventory/api/inventoryLots';
import { inventoryItemsApi } from '@/contexts/inventory/api/inventoryItems';
import { shipmentsApi } from '@/contexts/inventory/api/shipments';
import { vendorsApi } from '@/contexts/inventory/api/vendors';
import { VendorSelector } from '@/components/inventory/VendorSelector';
import { VendorDialog } from '@/components/inventory/dialogs/VendorDialog';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { toast } from 'sonner';
import { useInventory } from '@/contexts/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { Vendor } from '@/contexts/inventory/types';

interface ReceivingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItemId?: string | null;
}

interface ReceivingItem {
  item_id: string;
  item_name: string;
  sku?: string;
  quantity: number;
  cost_per_unit: number;
  lot_number: string;
  manufacturing_date?: string;
  expiration_date?: string;
}

export const ReceivingDialog: React.FC<ReceivingDialogProps> = ({
  open,
  onOpenChange,
  selectedItemId
}) => {
  const { user } = useAuth();
  const { items, refreshItems } = useInventory();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Header form data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vendor_id: '',
    reference_number: '',
    notes: '',
  });

  // Item entry form
  const [itemForm, setItemForm] = useState({
    item_id: selectedItemId || '',
    quantity: 1,
    cost_per_unit: 0,
    manufacturing_date: '',
    expiration_date: '',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    if (selectedItemId) {
      setItemForm(prev => ({ ...prev, item_id: selectedItemId }));
    }
  }, [selectedItemId]);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        date: new Date().toISOString().split('T')[0],
        vendor_id: '',
        reference_number: '',
        notes: '',
      });
      setItemForm({
        item_id: '',
        quantity: 1,
        cost_per_unit: 0,
        manufacturing_date: '',
        expiration_date: '',
      });
      setReceivingItems([]);
      setSearchTerm('');
    }
  }, [open]);

  const loadVendors = async () => {
    try {
      const data = await vendorsApi.getAll();
      setVendors(data);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  };

  const generateLotNumber = () => {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `LOT-${date}-${random}`;
  };

  const addItemToReceiving = () => {
    if (!itemForm.item_id || itemForm.quantity <= 0) {
      toast.error('Please select an item and enter quantity');
      return;
    }

    const selectedItem = items.find(i => i.id === itemForm.item_id);
    if (!selectedItem) return;

    const lotNumber = generateLotNumber();
    const newItem: ReceivingItem = {
      item_id: itemForm.item_id,
      item_name: selectedItem.name,
      sku: selectedItem.sku,
      quantity: itemForm.quantity,
      cost_per_unit: itemForm.cost_per_unit,
      lot_number: lotNumber,
      manufacturing_date: itemForm.manufacturing_date || undefined,
      expiration_date: itemForm.expiration_date || undefined,
    };

    setReceivingItems(prev => [...prev, newItem]);
    
    // Reset item form
    setItemForm({
      item_id: '',
      quantity: 1,
      cost_per_unit: 0,
      manufacturing_date: '',
      expiration_date: '',
    });
    
    toast.success(`Added ${selectedItem.name} to receiving list`);
  };

  const removeItem = (index: number) => {
    setReceivingItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleVendorSave = async (vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'organization_id' | 'created_by'>) => {
    try {
      const newVendor = await vendorsApi.create(vendorData);
      setVendors(prev => [...prev, newVendor]);
      setFormData(prev => ({ ...prev, vendor_id: newVendor.id }));
      setVendorDialogOpen(false);
      toast.success('Vendor created successfully');
    } catch (error) {
      console.error('Failed to create vendor:', error);
      toast.error('Failed to create vendor');
    }
  };

  const postReceipt = async () => {
    if (receivingItems.length === 0) {
      toast.error('Please add at least one item to receive');
      return;
    }

    setLoading(true);
    try {
      // Auto-create shipment in background
      let shipmentId = null;
      if (formData.vendor_id || formData.reference_number) {
        const selectedVendor = vendors.find(v => v.id === formData.vendor_id);
        const shipment = await shipmentsApi.create({
          organization_id: '', // Will be set by RLS
          received_date: formData.date,
          vendor_id: formData.vendor_id || undefined,
          supplier_info: selectedVendor ? { name: selectedVendor.name } : undefined,
          reference_number: formData.reference_number || undefined,
          notes: formData.notes || undefined,
          created_by: user?.id || '',
        });
        shipmentId = shipment.id;
      }

      // Process each receiving item
      for (const item of receivingItems) {
        // Create lot record
        await inventoryLotsApi.create({
          organization_id: '', // Will be set by RLS
          item_id: item.item_id,
          lot_number: item.lot_number,
          manufacturing_date: item.manufacturing_date || null,
          expiration_date: item.expiration_date || null,
          quantity_received: item.quantity,
          quantity_remaining: item.quantity,
          cost_per_unit: item.cost_per_unit || null,
          supplier_info: formData.vendor_id ? { name: vendors.find(v => v.id === formData.vendor_id)?.name || '' } : null,
          notes: null,
          is_active: true,
          created_by: '', // Will be set by auth
          shipment_id: shipmentId
        });

        // Update item stock
        const selectedItem = items.find(i => i.id === item.item_id);
        if (selectedItem) {
          const newStock = (selectedItem.current_stock || 0) + item.quantity;
          await inventoryItemsApi.updateStock(selectedItem.id, newStock);
        }
      }

      await refreshItems();
      toast.success(`Successfully received ${receivingItems.length} item(s)`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error posting receipt:', error);
      toast.error('Failed to post receipt');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-primary" />
            Receive Stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receipt Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <VendorSelector
                    vendors={vendors}
                    value={formData.vendor_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, vendor_id: value || '' }))}
                    onAddVendor={() => setVendorDialogOpen(true)}
                    placeholder="Select vendor (optional)..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.reference_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                      placeholder="PO number, invoice, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Items Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Items to Receipt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Item Search */}
              <div className="space-y-2">
                <Label>Search Items</Label>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, SKU, or barcode..."
                  />
                </div>
              </div>

              {/* Item Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item *</Label>
                  <Select 
                    value={itemForm.item_id} 
                    onValueChange={(value) => setItemForm(prev => ({ ...prev, item_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredItems.map((item) => (
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
                </div>

                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cost per Unit</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemForm.cost_per_unit}
                    onChange={(e) => setItemForm(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expiration Date</Label>
                  <Input
                    type="date"
                    value={itemForm.expiration_date}
                    onChange={(e) => setItemForm(prev => ({ ...prev, expiration_date: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={addItemToReceiving} disabled={!itemForm.item_id || itemForm.quantity <= 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Items to Receive */}
          {receivingItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Items to Receive ({receivingItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {receivingItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.item_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {item.quantity} • 
                          {item.cost_per_unit > 0 && ` Cost: $${item.cost_per_unit} • `}
                          Lot: {item.lot_number}
                          {item.expiration_date && ` • Exp: ${new Date(item.expiration_date).toLocaleDateString()}`}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={postReceipt} 
              disabled={loading || receivingItems.length === 0}
            >
              {loading ? 'Processing...' : 'Post Receipt'}
            </Button>
          </div>
        </div>

        {/* Vendor Dialog */}
        <VendorDialog
          open={vendorDialogOpen}
          onOpenChange={setVendorDialogOpen}
          onSave={handleVendorSave}
        />
      </DialogContent>
    </Dialog>
  );
};