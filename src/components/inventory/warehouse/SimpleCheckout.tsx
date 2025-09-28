import React, { useState, useEffect, useMemo } from 'react';
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
import { ShoppingCart, Search, X, Package, Plus, Minus, Scan, Zap, Receipt, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { warehouseApi } from '@/contexts/warehouse/api/warehouseApi';
import { useWarehouse } from '@/contexts/warehouse/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';
import { ScannerOverlay } from '@/components/inventory/ScannerOverlay';
import { useScanGun } from '@/hooks/useScanGun';
import { useDebounce } from '@/hooks/useDebounce';
import { ClientSelector } from '@/components/finance/invoices/ClientSelector';
import { InvoiceClient } from '@/types/invoices';
import { invoiceService } from '@/services/invoiceService';
import { generateInvoicePDF } from '@/utils/generateInvoicePDF';

interface SimpleCheckoutProps {
  warehouseId?: string;
  onClose?: () => void;
  onRefresh?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  on_hand?: number;
  unit_cost?: number;
  sale_price?: number;
}

interface CheckoutItem extends InventoryItem {
  quantity: number;
  unit_price?: number;
}

export const SimpleCheckout: React.FC<SimpleCheckoutProps> = ({ 
  warehouseId, 
  onClose, 
  onRefresh,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}) => {
  const { user } = useAuth();
  const { updateItemStock } = useWarehouse();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  
  // Form data
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [createInvoice, setCreateInvoice] = useState(false);
  const [selectedClient, setSelectedClient] = useState<InvoiceClient | null>(null);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [taxRate, setTaxRate] = useState(0);
  
  // Items
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Processing
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scannerConnected, setScannerConnected] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Search for items when query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim() && user?.organizationId) {
      performSearch();
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedSearchQuery, user?.organizationId]);

  const performSearch = async () => {
    if (!user?.organizationId || !debouncedSearchQuery.trim()) return;
    
    try {
      setIsLoading(true);
      const results = await warehouseApi.searchAllInventoryItemsWithStock(warehouseId || '', debouncedSearchQuery);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching items:', error);
      toast.error('Failed to search items');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle barcode scan
  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const results = await warehouseApi.searchAllInventoryItemsWithStock(warehouseId || '', barcode);
      
      if (results.length === 0) {
        toast.error(`No item found with barcode: ${barcode}`);
        return;
      }
      
      const item = results[0];
      handleItemSelect(item);
      toast.success(`Scanned: ${item.name}`);
      
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Error searching barcode:', error);
      toast.error('Failed to search barcode');
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

  const handleItemSelect = (item: InventoryItem) => {
    if (!item.on_hand || item.on_hand <= 0) {
      toast.error(`${item.name} is out of stock`);
      return;
    }

    const existingItem = checkoutItems.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      if (existingItem.quantity >= item.on_hand) {
        toast.error(`Cannot add more. Max available: ${item.on_hand}`);
        return;
      }
      updateLineItem(existingItem.id, 'quantity', existingItem.quantity + 1);
      toast.success(`Added: ${item.name} (Qty: ${existingItem.quantity + 1})`);
    } else {
      const newItem: CheckoutItem = {
        ...item,
        quantity: 1,
        unit_price: item.sale_price || item.unit_cost || 0
      };
      setCheckoutItems(prev => [...prev, newItem]);
    }

    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const removeLineItem = (id: string) => {
    setCheckoutItems(prev => prev.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof CheckoutItem, value: string | number) => {
    setCheckoutItems(prev => prev.map(item => {
      if (item.id === id) {
        // Stock validation for quantity field
        if (field === 'quantity') {
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          const maxStock = item.on_hand || 0;
          
          if (numValue > maxStock) {
            toast.error(`Cannot exceed available stock of ${maxStock}`);
            return item; // Don't update if exceeds stock
          }
          if (numValue < 0) {
            return { ...item, [field]: 0 }; // Don't allow negative quantities
          }
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const incrementQuantity = (id: string) => {
    const item = checkoutItems.find(item => item.id === id);
    if (!item) return;
    
    const newQuantity = item.quantity + 1;
    const maxStock = item.on_hand || 0;
    
    if (newQuantity > maxStock) {
      toast.error(`Cannot exceed available stock of ${maxStock}`);
      // Add haptic feedback for error
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      return;
    }
    
    updateLineItem(id, 'quantity', newQuantity);
    
    // Add haptic feedback for success
    if (navigator.vibrate) {
      navigator.vibrate(35);
    }
  };

  const decrementQuantity = (id: string) => {
    const item = checkoutItems.find(item => item.id === id);
    if (!item) return;
    
    const newQuantity = Math.max(0, item.quantity - 1);
    updateLineItem(id, 'quantity', newQuantity);
    
    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(35);
    }
  };

  const calculateSubtotal = () => {
    return checkoutItems.reduce((total, item) => {
      return total + (item.quantity * (item.unit_price || 0));
    }, 0);
  };

  const calculateTotalCost = () => {
    return checkoutItems.reduce((total, item) => {
      return total + (item.quantity * (item.unit_cost || 0));
    }, 0);
  };

  const calculateTotalProfit = () => {
    return calculateSubtotal() - calculateTotalCost();
  };

  const calculateTax = () => {
    return calculateSubtotal() * (taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async () => {
    if (!warehouseId) {
      toast.error('No warehouse selected');
      return;
    }

    const validItems = checkoutItems.filter(item => item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one item with quantity > 0');
      return;
    }

    if (createInvoice && !selectedClient) {
      toast.error('Please select a client for invoice creation');
      return;
    }

    try {
      setIsProcessing(true);

      // Process inventory withdrawals using warehouse context for real-time updates
      for (const item of validItems) {
        const success = await updateItemStock(item.id, -item.quantity);
        if (!success) {
          throw new Error(`Failed to withdraw ${item.name}`);
        }
      }

      let invoice = null;

      // Create invoice if requested
      if (createInvoice && selectedClient) {
        const lineItems = validItems.map(item => ({
          description: item.name + (item.sku ? ` (${item.sku})` : ''),
          quantity: item.quantity,
          unit_price: item.unit_price || 0,
          total_price: item.quantity * (item.unit_price || 0)
        }));

        invoice = await invoiceService.createInvoice({
          client: selectedClient,
          lineItems,
          notes: notes + (reference ? ` | Reference: ${reference}` : ''),
          payment_terms: paymentTerms,
          tax_rate: taxRate,
          transaction_reference: `Warehouse checkout: ${warehouseId}`,
        });

        // Generate PDF with error handling
        try {
          generateInvoicePDF(invoice);
          toast.success(`Checkout completed and invoice ${invoice.invoice_number} created with PDF!`);
        } catch (pdfError) {
          console.warn('PDF generation failed but checkout was successful:', pdfError);
          toast.success(`Checkout completed and invoice ${invoice.invoice_number} created! (PDF generation failed - you can regenerate it later)`);
        }
      } else {
        toast.success('Checkout completed successfully!');
      }
      
      // Reset form and close
      resetForm();
      setOpen(false);
      
      // Stock is already updated via warehouse context, no manual refresh needed
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Checkout failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCheckoutDate(new Date().toISOString().split('T')[0]);
    setReference('');
    setNotes('');
    setCreateInvoice(false);
    setSelectedClient(null);
    setPaymentTerms('Net 30');
    setTaxRate(0);
    setCheckoutItems([]);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setScanMode(false);
    setShowScanner(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalItems = checkoutItems.length;
  const totalQuantity = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        {/* Only show trigger if not controlled externally */}
        {controlledOpen === undefined && (
          <DrawerTrigger asChild>
            <Button className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Start Checkout
            </Button>
          </DrawerTrigger>
        )}
        <DrawerContent>
          <div className="mx-auto w-full max-w-6xl">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Inventory Checkout
              </DrawerTitle>
              <DrawerDescription>
                Select items from inventory and create checkout or invoice
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-4 space-y-6">
              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkoutDate">Checkout Date</Label>
                  <Input
                    id="checkoutDate"
                    type="date"
                    value={checkoutDate}
                    onChange={(e) => setCheckoutDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Input
                    id="reference"
                    placeholder="Order #, receipt #, etc."
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
              </div>

              {/* Invoice Options */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="create-invoice"
                    checked={createInvoice}
                    onCheckedChange={setCreateInvoice}
                  />
                  <Label htmlFor="create-invoice" className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Create Invoice
                  </Label>
                </div>

                {createInvoice && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                    <div className="md:col-span-3">
                      <ClientSelector
                        selectedClient={selectedClient}
                        onClientSelect={setSelectedClient}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-terms">Payment Terms</Label>
                      <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                          <SelectItem value="Net 15">Net 15</SelectItem>
                          <SelectItem value="Net 30">Net 30</SelectItem>
                          <SelectItem value="Net 60">Net 60</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                      <Input
                        id="tax-rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional notes for invoice..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Items to Checkout</Label>
                  
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
                          if (searchResults.length > 0) setShowResults(true);
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
                    {showResults && searchResults.length > 0 && (
                      <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto border shadow-lg bg-background">
                        <CardContent className="p-2">
                          {searchResults.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleItemSelect(item)}
                              className={`flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer ${
                                (item.on_hand || 0) <= 0 ? 'opacity-50' : ''
                              }`}
                            >
                              <div className="flex-1">
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground flex gap-2">
                                  {item.sku && <span>SKU: {item.sku}</span>}
                                  {item.barcode && <span>| {item.barcode}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={(item.on_hand || 0) > 0 ? 'secondary' : 'destructive'}>
                                  Stock: {item.on_hand || 0}
                                </Badge>
                                {item.sale_price && (
                                  <div className="text-sm font-medium">
                                    {formatCurrency(item.sale_price)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* No Results */}
                    {showResults && searchResults.length === 0 && debouncedSearchQuery && !isLoading && (
                      <Card className="absolute top-full left-0 right-0 z-50 mt-1 border shadow-lg bg-background">
                        <CardContent className="p-4 text-center text-muted-foreground">
                          No items found matching "{debouncedSearchQuery}"
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

                {/* Cart Items */}
                {checkoutItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Items Added</h3>
                    <p className="text-muted-foreground mb-4">
                      Search for items above to add them to your checkout
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {checkoutItems.map((item) => (
                      <Card key={item.id} className="border-l-4 border-l-primary/20">
                        <CardContent className="p-4">
                          {/* Mobile-First Layout */}
                          <div className="space-y-4">
                            {/* Item Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-base leading-tight mb-1">
                                  {item.name}
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
                                onClick={() => removeLineItem(item.id)}
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive min-h-[44px] min-w-[44px] p-0 shrink-0 ml-2"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Stock and Price Info */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge 
                                  variant={
                                    (item.on_hand || 0) <= 0 ? 'destructive' : 
                                    (item.on_hand || 0) <= 5 ? 'secondary' : 'default'
                                  }
                                  className="text-xs"
                                >
                                  Stock: {item.on_hand || 0}
                                </Badge>
                                {item.unit_cost && (
                                  <div className="text-sm text-muted-foreground">
                                    Cost: {formatCurrency(item.unit_cost)}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">
                                  {formatCurrency((item.quantity || 0) * (item.unit_price || 0))}
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
                                    onClick={() => decrementQuantity(item.id)}
                                    disabled={item.quantity <= 0}
                                    className="h-10 w-10 p-0 shrink-0"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <div className="mx-3 text-center min-w-[60px]">
                                    <div className="text-2xl font-bold">{item.quantity}</div>
                                    <div className="text-xs text-muted-foreground">
                                      of {item.on_hand || 0}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => incrementQuantity(item.id)}
                                    disabled={item.quantity >= (item.on_hand || 0)}
                                    className="h-10 w-10 p-0 shrink-0"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Unit Price Section */}
                              <div className="flex items-center justify-between gap-4">
                                <Label className="text-sm font-medium">Sale Price</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={item.unit_price || ''}
                                    onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                    className="w-24 text-right h-10"
                                  />
                                  <div className="text-sm text-muted-foreground">
                                    each
                                  </div>
                                </div>
                              </div>

                              {/* Profit Display */}
                              {item.unit_cost && (item.unit_price || 0) > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Profit per unit:</span>
                                  <span className={`font-medium ${
                                    ((item.unit_price || 0) - item.unit_cost) >= 0 
                                      ? 'text-green-600' 
                                      : 'text-red-600'
                                  }`}>
                                    {formatCurrency((item.unit_price || 0) - item.unit_cost)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                     {/* Totals */}
                     <div className="flex justify-end pt-4">
                       <div className="text-right space-y-1 min-w-64">
                         <div className="flex justify-between">
                           <span className="text-sm text-muted-foreground">Subtotal:</span>
                           <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-muted-foreground">Cost:</span>
                           <span className="text-muted-foreground">{formatCurrency(calculateTotalCost())}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-muted-foreground">Profit:</span>
                           <span className={`font-medium ${calculateTotalProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                             {formatCurrency(calculateTotalProfit())}
                           </span>
                         </div>
                         {taxRate > 0 && (
                           <div className="flex justify-between">
                             <span className="text-sm text-muted-foreground">Tax ({taxRate}%):</span>
                             <span className="font-medium">{formatCurrency(calculateTax())}</span>
                           </div>
                         )}
                         <div className="flex justify-between text-lg font-semibold border-t pt-1">
                           <span>Total:</span>
                           <span>{formatCurrency(calculateTotal())}</span>
                         </div>
                         <div className="text-xs text-muted-foreground">
                           {totalItems} items, {totalQuantity} units
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
                  disabled={checkoutItems.length === 0 || isProcessing}
                >
                  {isProcessing ? 'Processing...' : createInvoice ? `Checkout & Create Invoice (${totalItems} items)` : `Checkout (${totalItems} items)`}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)} 
                  className="flex-1"
                  disabled={isProcessing}
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
        continuous={true}
        instructions="Scan item barcodes to add them to checkout"
      />
    </>
  );
};