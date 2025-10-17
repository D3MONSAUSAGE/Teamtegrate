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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Package, Search, Loader2, Scan, Zap, Calendar, QrCode, DollarSign, X, Receipt } from 'lucide-react';
import { useInventory } from '@/contexts/inventory';
import { warehouseApi } from '@/contexts/warehouse/api/warehouseApi';
import { useWarehouse } from '@/contexts/warehouse/WarehouseContext';
import { ScannerOverlay } from '@/components/inventory/ScannerOverlay';
import { useScanGun } from '@/hooks/useScanGun';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';
import { VendorSelector } from '@/components/inventory/VendorSelector';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReceiveStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  onSuccess?: () => void; // Optional since we use warehouse context for updates
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
  const { refreshWarehouseItems } = useWarehouse();
  const { user } = useAuth();
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // Invoice tracking fields
  const [createInvoiceRecord, setCreateInvoiceRecord] = useState(false);
  const [invoiceTotal, setInvoiceTotal] = useState<number>(0);
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'partial' | 'paid' | 'void'>('unpaid');
  
  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scannerConnected, setScannerConnected] = useState(false);
  const [showResults, setShowResults] = useState(false);

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

  // Auto-populate invoice total when items change
  useEffect(() => {
    if (createInvoiceRecord && receiveItems.length > 0) {
      setInvoiceTotal(totalCost);
    }
  }, [receiveItems, totalCost, createInvoiceRecord]);

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

    // Validate invoice creation if enabled
    if (createInvoiceRecord && !selectedVendor) {
      toast.error('Please select a vendor to create an invoice record');
      return;
    }

    if (createInvoiceRecord && !invoiceNumber) {
      toast.error('Please enter an invoice number to create an invoice record');
      return;
    }

    try {
      setSubmitting(true);

      // Step 1: Create invoice record if requested
      if (createInvoiceRecord && selectedVendor && invoiceNumber) {
        const { data: warehouseData } = await supabase
          .from('warehouses')
          .select('team_id')
          .eq('id', warehouseId)
          .single();

        const invoiceRecord = {
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString().split('T')[0],
          branch: warehouseData?.team_id || '',
          team_id: warehouseData?.team_id,
          vendor_id: selectedVendor,
          invoice_total: invoiceTotal || totalCost,
          currency: 'USD',
          payment_status: paymentStatus,
          payment_due_date: paymentDueDate || null,
          paid_amount: 0,
          reference_number: invoiceNumber,
          notes: notes,
          file_path: '',
          file_name: `Stock Receipt ${invoiceNumber}`,
          file_type: 'application/octet-stream',
          file_size: 0,
          uploader_name: user?.name || user?.email || 'Unknown',
          user_id: user?.id,
          organization_id: user?.organizationId
        };

        const { error: invoiceError } = await supabase
          .from('invoices')
          .insert([invoiceRecord]);

        if (invoiceError) {
          console.error('Invoice creation error:', invoiceError);
          toast.error(`Failed to create invoice: ${invoiceError.message}`);
          return;
        }
      }

      // Step 2: Prepare items for the API with lot tracking and vendor information
      const items = receiveItems.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        lot_number: item.lot_number,
        vendor_id: selectedVendor,
        invoice_number: invoiceNumber
      }));

      // Step 3: Call the receiveStock API which handles creating warehouse_items if they don't exist
      await warehouseApi.receiveStock(warehouseId, items);
      
      // Step 4: Refresh warehouse items to show updated stock levels
      await refreshWarehouseItems();

      toast.success(
        createInvoiceRecord
          ? `Successfully received stock and created expense invoice ${invoiceNumber}!`
          : `Successfully received ${receiveItems.length} item${receiveItems.length !== 1 ? 's' : ''}!`
      );
      
      // Reset form
      setReceiveItems([]);
      setNotes('');
      setSearchQuery('');
      setSelectedVendor(undefined);
      setInvoiceNumber('');
      setCreateInvoiceRecord(false);
      setInvoiceTotal(0);
      setPaymentDueDate('');
      setPaymentStatus('unpaid');
      
      // Close dialog (no manual refresh needed - warehouse context handles updates)
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error receiving stock:', error);
      toast.error(`Failed to receive stock: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalItems = receiveItems.length;
  const totalQuantity = receiveItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-6xl">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Receive Stock
              </DrawerTitle>
              <DrawerDescription>
                Add items to warehouse inventory with lot tracking and vendor information
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-4 space-y-6">
              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <VendorSelector
                  vendors={vendors}
                  value={selectedVendor}
                  onValueChange={setSelectedVendor}
                  placeholder="Select vendor..."
                />
                <div className="space-y-2">
                  <Label>Invoice/Reference Number</Label>
                  <Input
                    placeholder="Enter invoice or reference number..."
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Invoice Tracking Toggle - Compact */}
              {createInvoiceRecord && (
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="pt-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="invoice-total" className="text-sm">
                          Invoice Total <span className="text-xs text-muted-foreground">(optional)</span>
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            id="invoice-total"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Auto-calculated"
                            value={invoiceTotal || ''}
                            onChange={(e) => setInvoiceTotal(parseFloat(e.target.value) || 0)}
                            className="pl-8 h-9 text-sm"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          From items: {formatCurrency(totalCost)}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="payment-due-date" className="text-sm">
                          Due Date <span className="text-xs text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                          id="payment-due-date"
                          type="date"
                          value={paymentDueDate}
                          onChange={(e) => setPaymentDueDate(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="payment-status" className="text-sm">Payment Status</Label>
                        <Select value={paymentStatus} onValueChange={(val: any) => setPaymentStatus(val)}>
                          <SelectTrigger id="payment-status" className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                            <SelectItem value="partial">Partially Paid</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="void">Void</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Toggle at bottom of header section */}
              <div className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg border border-dashed">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium cursor-pointer" htmlFor="invoice-toggle">
                    Save as Expense Invoice
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    (Track for financial reporting)
                  </span>
                </div>
                <Switch
                  id="invoice-toggle"
                  checked={createInvoiceRecord}
                  onCheckedChange={setCreateInvoiceRecord}
                />
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Items to Receive</Label>
                  
                  {/* Scanner Controls */}
                  <div className="flex items-center gap-4">
                    {scannerConnected && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-medium text-primary">Hardware Scanner Active</span>
                        <Zap className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor="scan-mode" className="text-sm">
                        {scannerConnected ? 'Scanning' : 'Scan Mode'}
                      </Label>
                      <Switch
                        id="scan-mode"
                        checked={scanMode}
                        onCheckedChange={setScanMode}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Search Section */}
                <div className="space-y-3">
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={
                          scanMode && scannerConnected 
                            ? "Ready for hardware scanner - or search manually..." 
                            : scanMode 
                              ? "Scan with camera or search manually..." 
                              : "Search items by name, SKU, or barcode..."
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => {
                          if (filteredItems.length > 0) setShowResults(true);
                        }}
                        className="pl-10"
                        disabled={scanMode && !searchQuery}
                      />
                    </div>
                    
                    {/* Scan Button */}
                    {scanMode && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowScanner(true)}
                          className="p-2"
                        >
                          <Scan className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Search Results */}
                    {searchQuery && filteredItems.length > 0 && (
                      <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto border shadow-lg bg-background">
                        <CardContent className="p-2">
                          {filteredItems.slice(0, 10).map((item) => (
                            <div
                              key={item.id}
                              onClick={() => addItem(item.id)}
                              className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer"
                            >
                              <div className="flex-1">
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground flex gap-2">
                                  {item.sku && <span>SKU: {item.sku}</span>}
                                  {item.barcode && <span>| {item.barcode}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  Stock: {item.current_stock || 0}
                                </Badge>
                                {(item.purchase_price || item.unit_cost || item.calculated_unit_price) && (
                                  <div className="text-sm font-medium">
                                    {formatCurrency(item.purchase_price || item.unit_cost || item.calculated_unit_price || 0)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* No Results */}
                    {searchQuery && filteredItems.length === 0 && (
                      <Card className="absolute top-full left-0 right-0 z-50 mt-1 border shadow-lg bg-background">
                        <CardContent className="p-4 text-center text-muted-foreground">
                          No items found matching "{searchQuery}"
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  {/* Scanner Status */}
                  {scanMode && (
                    <div className={`rounded-lg p-3 border ${
                      scannerConnected 
                        ? 'bg-primary/5 border-primary/20' 
                        : 'bg-muted/50 border-muted'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          scannerConnected ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'
                        }`} />
                        <div className="flex-1">
                          {scannerConnected ? (
                            <div>
                              <div className="font-medium text-primary text-sm">🎯 Hardware Scanner Connected</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Point scanner at any barcode to add items instantly
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-sm">📱 Camera Scanning Available</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Use camera scan button or connect a hardware scanner for faster scanning
                              </div>
                            </div>
                          )}
                        </div>
                        {scannerConnected && <Zap className="h-4 w-4 text-primary" />}
                      </div>
                    </div>
                  )}
                </div>

                {/* Items to Receive */}
                {receiveItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Items Added</h3>
                    <p className="text-muted-foreground mb-4">
                      Search for items above to add them to your receiving list
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {receiveItems.map((item, index) => (
                      <Card key={item.item_id} className="border-l-4 border-l-primary/20">
                        <CardContent className="p-4">
                          {/* Mobile-First Layout */}
                          <div className="space-y-4">
                            {/* Item Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-base leading-tight mb-1">
                                  {item.item_name}
                                </h4>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  {item.sku && (
                                    <Badge variant="outline" className="text-xs">
                                      SKU: {item.sku}
                                    </Badge>
                                  )}
                                  {item.barcode && (
                                    <Badge variant="outline" className="text-xs">
                                      {item.barcode}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                onClick={() => removeItem(index)}
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive min-h-[44px] min-w-[44px] p-0 shrink-0 ml-2"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Total Cost Display */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="text-xs">
                                  Lot: {item.lot_number || 'Auto-generated'}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">
                                  {formatCurrency(item.quantity * item.unit_cost)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Line Total
                                </div>
                              </div>
                            </div>

                            {/* Quantity Controls - Mobile Optimized */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Quantity</Label>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    className="h-10 w-10 p-0 shrink-0"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <div className="mx-3 text-center min-w-[60px]">
                                    <div className="text-2xl font-bold">{item.quantity}</div>
                                    <div className="text-xs text-muted-foreground">
                                      units
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                    className="h-10 w-10 p-0 shrink-0"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Unit Cost Section */}
                              <div className="flex items-center justify-between gap-4">
                                <Label className="text-sm font-medium">Unit Cost</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={item.unit_cost}
                                    onChange={(e) => updateItemCost(index, parseFloat(e.target.value) || 0)}
                                    className="w-24 text-right h-10"
                                  />
                                  <div className="text-sm text-muted-foreground">
                                    each
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Lot Tracking Section */}
                            <div className="space-y-3 pt-2 border-t">
                              <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm font-medium min-w-[100px]">Lot Number</Label>
                                  <div className="flex gap-2 flex-1">
                                    <Input
                                      value={item.lot_number || ''}
                                      onChange={(e) => updateItemField(index, 'lot_number', e.target.value)}
                                      placeholder="Auto-generated"
                                      className="flex-1"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => generateLotNumber(index)}
                                      className="p-2"
                                    >
                                      <QrCode className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Manufacturing Date</Label>
                                    <Input
                                      type="date"
                                      value={item.manufacturing_date || ''}
                                      onChange={(e) => updateItemField(index, 'manufacturing_date', e.target.value)}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Expiration Date</Label>
                                    <Input
                                      type="date"
                                      value={item.expiration_date || ''}
                                      onChange={(e) => updateItemField(index, 'expiration_date', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Totals */}
                    <div className="flex justify-end pt-4">
                      <div className="text-right space-y-1 min-w-64">
                        <div className="flex justify-between text-lg font-semibold border-t pt-1">
                          <span>Total Cost:</span>
                          <span>{formatCurrency(totalCost)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {totalItems} items, {totalQuantity} units
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {receiveItems.length > 0 && (
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any notes about this stock receipt..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>

            <DrawerFooter>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1"
                  disabled={receiveItems.length === 0 || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Receiving...
                    </>
                  ) : (
                    `Receive Stock (${totalItems} items)`
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
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

      {/* Scanner Overlay */}
      <ScannerOverlay
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onBarcode={handleBarcodeScanned}
      />
    </>
  );
};