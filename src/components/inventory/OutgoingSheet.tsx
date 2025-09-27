import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Search, Package, Trash2, Plus, Minus, DollarSign, AlertTriangle, Zap, FileText, Printer, Building } from 'lucide-react';
import { InventoryItem } from '@/contexts/inventory/types';
import { useScanGun } from '@/hooks/useScanGun';
import { ClientSelector } from '@/components/finance/invoices/ClientSelector';
import { InvoiceClient } from '@/types/invoices';
import { useInvoiceClients } from '@/hooks/useInvoiceClients';
import { CustomerManagementSheet } from './CustomerManagementSheet';
import { toast } from 'sonner';

// Withdrawal reason types
const WITHDRAWAL_REASONS = [
  { id: 'sale', label: 'Sale', requiresCustomer: true, allowsPricing: true },
  { id: 'waste', label: 'Waste/Spoilage', requiresCustomer: false, allowsPricing: false },
  { id: 'damage', label: 'Damaged Goods', requiresCustomer: false, allowsPricing: false },
  { id: 'transfer', label: 'Transfer Out', requiresCustomer: false, allowsPricing: false },
  { id: 'sampling', label: 'Sampling/Testing', requiresCustomer: false, allowsPricing: false },
  { id: 'promotion', label: 'Promotional Use', requiresCustomer: false, allowsPricing: false },
  { id: 'other', label: 'Other', requiresCustomer: false, allowsPricing: false },
];

interface LineItem {
  id: string;
  item: InventoryItem;
  quantity: number;
  unitPrice: number; // Could be unit_cost or sale_price depending on withdrawal reason
  totalCost: number;
  profit?: number; // Only for sales
}

interface OutgoingSheetProps {
  open: boolean;
  onClose: () => void;
  onItemsWithdrawn: (items: LineItem[], reason: string, customerInfo?: any, notes?: string) => Promise<void>;
  availableItems: InventoryItem[];
  onScanItem: (barcode: string) => Promise<InventoryItem | null>;
  onCreateInvoice?: (client: InvoiceClient, lineItems: LineItem[], notes?: string) => Promise<void>;
}

export const OutgoingSheet: React.FC<OutgoingSheetProps> = ({
  open, 
  onClose, 
  onItemsWithdrawn, 
  availableItems,
  onScanItem,
  onCreateInvoice
}) => {
  // State management
  const [withdrawalReason, setWithdrawalReason] = useState<string>('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [scanMode, setScanMode] = useState(false);
  const [scannerConnected, setScannerConnected] = useState(false);
  const [selectedClient, setSelectedClient] = useState<InvoiceClient | null>(null);
  const [createInvoiceOption, setCreateInvoiceOption] = useState(false);
  const [showCustomerManagement, setShowCustomerManagement] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get current withdrawal reason configuration
  const currentReason = WITHDRAWAL_REASONS.find(r => r.id === withdrawalReason);

  // Calculate totals
  const totals = lineItems.reduce((acc, item) => {
    acc.totalCost += item.totalCost;
    acc.totalProfit += item.profit || 0;
    acc.totalItems += item.quantity;
    return acc;
  }, { totalCost: 0, totalProfit: 0, totalItems: 0 });

  // Scanner functionality
  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const item = await onScanItem(barcode);
      if (item) {
        addItemToList(item);
        toast.success(`Added ${item.name} to the list`);
      } else {
        toast.error('Item not found');
      }
    } catch (error) {
      console.error('Error scanning item:', error);
      toast.error('Failed to scan item');
    }
  };

  // Hardware scanner integration (following ReceiveStockDrawer pattern)
  const { isListening, scannerConnected: hardwareScannerConnected, reset } = useScanGun({
    onScan: handleBarcodeScanned,
    onStart: () => console.log('SCANGUN_START'),
    onStop: () => console.log('SCANGUN_STOP'),
    enabled: scanMode && open,
  });

  // Update scanner connected state and auto-enable scan mode for hardware scanners
  useEffect(() => {
    setScannerConnected(hardwareScannerConnected);
    
    // Auto-enable scan mode when hardware scanner is detected
    if (hardwareScannerConnected && open) {
      setScanMode(true);
    }
  }, [hardwareScannerConnected, open]);

  // Add item to line items
  const addItemToList = (item: InventoryItem, quantity: number = 1) => {
    const existingIndex = lineItems.findIndex(lineItem => lineItem.item.id === item.id);
    
    if (existingIndex >= 0) {
      // Update existing item
      updateLineItemQuantity(lineItems[existingIndex].id, lineItems[existingIndex].quantity + quantity);
    } else {
      // Add new item
      const unitPrice = currentReason?.allowsPricing && item.sale_price ? item.sale_price : (item.unit_cost || 0);
      const newLineItem: LineItem = {
        id: `${item.id}-${Date.now()}`,
        item,
        quantity,
        unitPrice,
        totalCost: unitPrice * quantity,
        profit: currentReason?.allowsPricing && item.sale_price && item.unit_cost 
          ? (item.sale_price - item.unit_cost) * quantity 
          : undefined
      };
      setLineItems(prev => [...prev, newLineItem]);
    }
  };

  // Update line item quantity
  const updateLineItemQuantity = (lineItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeLineItem(lineItemId);
      return;
    }

    setLineItems(prev => prev.map(lineItem => {
      if (lineItem.id === lineItemId) {
        const totalCost = lineItem.unitPrice * newQuantity;
        return {
          ...lineItem,
          quantity: newQuantity,
          totalCost,
          profit: lineItem.profit !== undefined 
            ? ((lineItem.item.sale_price || 0) - (lineItem.item.unit_cost || 0)) * newQuantity
            : undefined
        };
      }
      return lineItem;
    }));
  };

  // Update line item unit price
  const updateLineItemPrice = (lineItemId: string, newPrice: number) => {
    setLineItems(prev => prev.map(lineItem => {
      if (lineItem.id === lineItemId) {
        const totalCost = newPrice * lineItem.quantity;
        return {
          ...lineItem,
          unitPrice: newPrice,
          totalCost,
          profit: currentReason?.allowsPricing && lineItem.item.unit_cost
            ? (newPrice - lineItem.item.unit_cost) * lineItem.quantity
            : undefined
        };
      }
      return lineItem;
    }));
  };

  // Remove line item
  const removeLineItem = (lineItemId: string) => {
    setLineItems(prev => prev.filter(lineItem => lineItem.id !== lineItemId));
  };

  // Filter available items for search
  const filteredItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.barcode && item.barcode.includes(searchTerm))
  ).slice(0, 10);

  // Handle form submission
  const handleSubmit = async () => {
    if (!withdrawalReason) {
      toast.error('Please select a withdrawal reason');
      return;
    }

    if (lineItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (currentReason?.requiresCustomer && !selectedClient) {
      toast.error('Please select a customer for sales');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create withdrawal transaction
      await onItemsWithdrawn(
        lineItems, 
        withdrawalReason, 
        currentReason?.requiresCustomer ? selectedClient : undefined,
        notes.trim() || undefined
      );

      // Create invoice if requested and it's a sale
      if (createInvoiceOption && currentReason?.id === 'sale' && selectedClient && onCreateInvoice) {
        await onCreateInvoice(selectedClient, lineItems, notes.trim() || undefined);
        toast.success('Items withdrawn and invoice created successfully');
      } else {
        toast.success('Items withdrawn successfully');
      }
      
      // Reset form
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error withdrawing items:', error);
      toast.error('Failed to withdraw items');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form function
  const resetForm = () => {
    setLineItems([]);
    setWithdrawalReason('');
    setSelectedClient(null);
    setCreateInvoiceOption(false);
    setShowCustomerManagement(false);
    setNotes('');
    setSearchTerm('');
    setScanMode(false);
  };

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <>
      {/* Customer Management Sheet */}
      <CustomerManagementSheet
        open={showCustomerManagement}
        onClose={() => setShowCustomerManagement(false)}
        onSelectCustomerForSale={(client) => {
          setSelectedClient(client);
          setShowCustomerManagement(false);
          toast.success(`Selected customer: ${client.name}`);
        }}
      />
      
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Withdraw Items
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {/* Withdrawal Reason Selection */}
            <div className="space-y-2">
              <Label>Withdrawal Reason *</Label>
              <Select value={withdrawalReason} onValueChange={setWithdrawalReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select withdrawal reason" />
                </SelectTrigger>
                <SelectContent>
                  {WITHDRAWAL_REASONS.map(reason => (
                    <SelectItem key={reason.id} value={reason.id}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Item Search & Scanner */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Items to Withdraw</Label>
                
                {/* Hardware Scanner Status & Controls */}
                <div className="flex items-center gap-4">
                  {/* Prominent Hardware Scanner Status */}
                  {scannerConnected && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm font-medium text-primary">Hardware Scanner Active</span>
                      <Zap className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  
                  {/* Scan Mode Toggle */}
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
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder={
                    scanMode && scannerConnected 
                      ? "Ready for hardware scanner - or search manually..." 
                      : scanMode 
                        ? "Enable hardware scanner or search manually..." 
                        : "Search items by name, SKU, or barcode..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={scanMode && !searchTerm}
                />
              </div>

              {/* Enhanced Scanning Status */}
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
                          <div className="font-medium text-sm">📱 Scan Mode Enabled</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Connect a hardware scanner or search manually
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchTerm && filteredItems.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
                  {filteredItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-background rounded hover:bg-accent/50 cursor-pointer"
                      onClick={() => {
                        addItemToList(item);
                        setSearchTerm('');
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Stock: {item.current_stock} • ${(item.unit_cost || 0).toFixed(2)}
                          {currentReason?.allowsPricing && item.sale_price && (
                            <span className="text-green-600 ml-2">Sale: ${item.sale_price.toFixed(2)}</span>
                          )}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Line Items */}
            {lineItems.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Items to Withdraw</Label>
                <div className="space-y-2">
                  {lineItems.map(lineItem => (
                    <Card key={lineItem.id} className="p-3">
                      <CardContent className="p-0 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{lineItem.item.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Stock: {lineItem.item.current_stock}</span>
                              {lineItem.item.sku && <span>• SKU: {lineItem.item.sku}</span>}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(lineItem.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Quantity Controls */}
                          <div className="space-y-1">
                            <Label className="text-xs">Quantity</Label>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateLineItemQuantity(lineItem.id, lineItem.quantity - 1)}
                                disabled={lineItem.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={lineItem.quantity}
                                onChange={(e) => updateLineItemQuantity(lineItem.id, parseFloat(e.target.value) || 1)}
                                min="1"
                                max={lineItem.item.current_stock}
                                className="h-8 text-center"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateLineItemQuantity(lineItem.id, lineItem.quantity + 1)}
                                disabled={lineItem.quantity >= lineItem.item.current_stock}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Unit Price (editable for sales) */}
                          <div className="space-y-1">
                            <Label className="text-xs">
                              Unit Price
                              {currentReason?.allowsPricing && <span className="text-green-600 ml-1">(Editable)</span>}
                            </Label>
                            <Input
                              type="number"
                              value={lineItem.unitPrice}
                              onChange={(e) => updateLineItemPrice(lineItem.id, parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              readOnly={!currentReason?.allowsPricing}
                              className="h-8"
                            />
                          </div>
                        </div>

                        {/* Cost breakdown */}
                        <div className="flex items-center justify-between text-sm border-t pt-2">
                          <span className="text-muted-foreground">Total Cost:</span>
                          <span className="font-medium">${lineItem.totalCost.toFixed(2)}</span>
                        </div>

                        {/* Profit display (for sales only) */}
                        {lineItem.profit !== undefined && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Profit:</span>
                            <span className={`font-medium ${lineItem.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${lineItem.profit.toFixed(2)}
                            </span>
                          </div>
                        )}

                        {/* Stock warning */}
                        {lineItem.quantity > lineItem.item.current_stock && (
                          <div className="flex items-center gap-1 text-xs text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            Insufficient stock available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Information for Sales */}
            {currentReason?.requiresCustomer && (
              <div className="space-y-4">
                {/* Enhanced Customer Selection Section */}
                <div className="p-4 border-2 border-primary/20 bg-primary/5 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-primary">Customer Required for Sale</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomerManagement(true)}
                      className="flex items-center gap-2"
                    >
                      <Building className="h-3 w-3" />
                      Manage Customers
                    </Button>
                  </div>
                  
                  {!selectedClient && (
                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-800">
                        Please select a customer to enable the withdrawal button
                      </span>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <ClientSelector
                      selectedClient={selectedClient}
                      onClientSelect={setSelectedClient}
                    />
                  </div>
                  
                  {selectedClient && (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm text-green-800 font-medium">
                        Customer selected: {selectedClient.name}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Invoice Creation Option */}
                {selectedClient && (
                  <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="create-invoice"
                      checked={createInvoiceOption}
                      onChange={(e) => setCreateInvoiceOption(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="create-invoice" className="text-sm">
                      Create invoice for this sale
                    </Label>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                placeholder="Additional notes or comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Summary & Actions */}
            {lineItems.length > 0 && (
              <div className="space-y-4">
                <Separator />
                
                {/* Totals */}
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Items:</span>
                    <Badge variant="secondary">{totals.totalItems}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Cost:</span>
                    <span className="font-bold">${totals.totalCost.toFixed(2)}</span>
                  </div>
                  {totals.totalProfit > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-600">Total Profit:</span>
                      <span className="font-bold text-green-600">${totals.totalProfit.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || lineItems.length === 0 || !withdrawalReason || (currentReason?.requiresCustomer && !selectedClient)}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? 'Processing...' : 
                     createInvoiceOption ? 'Withdraw & Create Invoice' : 'Withdraw Items'}
                  </Button>
                  
                  {/* Print Receipt Option for completed sales */}
                  {currentReason?.id === 'sale' && selectedClient && (
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center gap-2"
                      onClick={() => {
                        // TODO: Implement print receipt functionality
                        toast.success('Receipt printing functionality coming soon');
                      }}
                    >
                      <Printer className="h-4 w-4" />
                      Print Receipt
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};