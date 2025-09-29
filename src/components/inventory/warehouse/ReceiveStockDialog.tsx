import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Minus, Package, Search, Loader2, Scan, Zap, Calendar, QrCode, DollarSign } from 'lucide-react';
import { useInventory } from '@/contexts/inventory';
import { warehouseApi } from '@/contexts/warehouse/api/warehouseApi';
import { ScannerOverlay } from '@/components/inventory/ScannerOverlay';
import { useScanGun } from '@/hooks/useScanGun';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { VendorSelector } from '@/components/inventory/VendorSelector';
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
  barcode?: string;
  quantity: number;
  unit_cost: number;
  lot_number?: string;
  expiration_date?: string;
  manufacturing_date?: string;
}

export const ReceiveStockDialog: React.FC<ReceiveStockDialogProps> = ({
  open,
  onOpenChange,
  warehouseId,
  onSuccess
}) => {
  const { items: inventoryItems, vendors } = useInventory();
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scannerConnected, setScannerConnected] = useState(false);

  // Handle barcode scan
  const handleBarcodeScanned = (barcode: string) => {
    const item = inventoryItems.find(item => 
      item.barcode === barcode || 
      item.sku === barcode ||
      item.name.toLowerCase().includes(barcode.toLowerCase())
    );
    
    if (item) {
      addItem(item.id);
      toast.success(`Scanned: ${item.name}`);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } else {
      toast.error(`No item found with barcode: ${barcode}`);
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  };

  // Initialize hardware scanner
  const { isListening, scannerConnected: hardwareScannerConnected, reset } = useScanGun({
    onScan: handleBarcodeScanned,
    onStart: () => console.log('SCANGUN_START'),
    onStop: () => console.log('SCANGUN_STOP'),
    enabled: scanMode && open,
  });

  // Update scanner connected state
  useEffect(() => {
    setScannerConnected(hardwareScannerConnected);
    
    if (hardwareScannerConnected && open) {
      setScanMode(true);
    }
  }, [hardwareScannerConnected, open]);

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
      // Add new item with auto-generated lot number and auto-populated unit cost
      const lotNumber = BarcodeGenerator.generateLotNumber('LOT');
      // Use existing cost with priority: purchase_price → unit_cost → calculated_unit_price → 0
      const unitCost = item.purchase_price || item.unit_cost || item.calculated_unit_price || 0;
      
      setReceiveItems([...receiveItems, {
        item_id: itemId,
        item_name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        quantity: 1,
        unit_cost: unitCost,
        lot_number: lotNumber,
        expiration_date: '',
        manufacturing_date: new Date().toISOString().split('T')[0]
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

  const updateItemField = (index: number, field: keyof ReceiveItem, value: string | number) => {
    const updated = [...receiveItems];
    updated[index] = { ...updated[index], [field]: value };
    setReceiveItems(updated);
  };

  const generateLotNumber = (index: number) => {
    const lotNumber = BarcodeGenerator.generateLotNumber('LOT');
    updateItemField(index, 'lot_number', lotNumber);
  };

  const removeItem = (index: number) => {
    setReceiveItems(receiveItems.filter((_, i) => i !== index));
  };

  // Calculate total cost
  const totalCost = receiveItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

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

      // Prepare items for the API with lot tracking
      const items = receiveItems.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        lot_number: item.lot_number,
        vendor_id: selectedVendor,
        invoice_number: invoiceNumber
      }));

      // Call the new receiveStock API
      await warehouseApi.receiveStock(warehouseId, items);

      toast.success(`Successfully received ${receiveItems.length} item${receiveItems.length !== 1 ? 's' : ''}!`);
      
      // Reset form
      setReceiveItems([]);
      setNotes('');
      setSearchQuery('');
      setSelectedVendor(undefined);
      setInvoiceNumber('');
      
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
          {/* Vendor and Invoice Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vendor</Label>
              <VendorSelector
                vendors={vendors}
                value={selectedVendor}
                onValueChange={setSelectedVendor}
                placeholder="Select vendor..."
              />
            </div>
            <div className="space-y-2">
              <Label>Invoice/Reference Number</Label>
              <Input
                placeholder="Enter invoice or reference number..."
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Scanner Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {scannerConnected && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Scanner Connected</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Switch
                  id="scan-mode"
                  checked={scanMode}
                  onCheckedChange={setScanMode}
                />
                <Label htmlFor="scan-mode" className="flex items-center gap-2">
                  <Scan className="h-4 w-4" />
                  Scan Mode
                </Label>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-2"
              >
                <Scan className="h-4 w-4" />
                Camera Scan
              </Button>
            </div>
          </div>

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
                  <div key={item.item_id} className="border rounded-lg p-4 space-y-4">
                    {/* Item Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.item_name}</div>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          {item.sku && <span>SKU: {item.sku}</span>}
                          {item.barcode && <span>Barcode: {item.barcode}</span>}
                        </div>
                        <div className="text-sm font-medium text-primary">
                          Total: ${(item.quantity * item.unit_cost).toFixed(2)}
                        </div>
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

                    {/* Quantity and Cost Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
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
                      </div>

                      <div className="space-y-2">
                        <Label>Unit Cost</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">$</span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={item.unit_cost}
                            onChange={(e) => updateItemCost(index, parseFloat(e.target.value) || 0)}
                            className="flex-1"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Lot Tracking Row */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Lot Number</Label>
                        <div className="flex gap-2">
                          <Input
                            value={item.lot_number || ''}
                            onChange={(e) => updateItemField(index, 'lot_number', e.target.value)}
                            placeholder="Auto-generated"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateLotNumber(index)}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Manufacturing Date</Label>
                        <Input
                          type="date"
                          value={item.manufacturing_date || ''}
                          onChange={(e) => updateItemField(index, 'manufacturing_date', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Expiration Date</Label>
                        <Input
                          type="date"
                          value={item.expiration_date || ''}
                          onChange={(e) => updateItemField(index, 'expiration_date', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Cost Summary */}
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Cost:</span>
                  <span className="text-xl font-bold text-primary flex items-center gap-1">
                    <DollarSign className="h-5 w-5" />
                    {totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {receiveItems.length} item{receiveItems.length !== 1 ? 's' : ''} • 
                  {receiveItems.reduce((sum, item) => sum + item.quantity, 0)} total units
                </div>
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
            Receive Stock (${totalCost.toFixed(2)})
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Scanner Overlay */}
      <ScannerOverlay
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onBarcode={handleBarcodeScanned}
        continuous={true}
        instructions="Scan item barcodes to add them to receiving"
      />
    </Dialog>
  );
};