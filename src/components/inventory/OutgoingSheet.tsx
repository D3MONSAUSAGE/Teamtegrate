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
import { Search, Camera, Package, Trash2, Plus, Minus, DollarSign, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '@/contexts/inventory/types';
import { ScannerOverlay } from './ScannerOverlay';
import { useScanGun } from '@/hooks/useScanGun';
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
}

export const OutgoingSheet: React.FC<OutgoingSheetProps> = ({
  open, 
  onClose, 
  onItemsWithdrawn, 
  availableItems,
  onScanItem
}) => {
  // State management
  const [withdrawalReason, setWithdrawalReason] = useState<string>('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });
  const [notes, setNotes] = useState('');
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

  // Hardware scanner integration
  useScanGun({
    onScan: (result) => {
      if (open && !showScanner) {
        handleBarcodeScanned(result);
      }
    },
    enabled: open,
    minLength: 4,
  });

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

    if (currentReason?.requiresCustomer && !customerInfo.name.trim()) {
      toast.error('Customer information is required for sales');
      return;
    }

    setIsSubmitting(true);
    try {
      await onItemsWithdrawn(
        lineItems, 
        withdrawalReason, 
        currentReason?.requiresCustomer ? customerInfo : undefined,
        notes.trim() || undefined
      );
      
      // Reset form
      setLineItems([]);
      setWithdrawalReason('');
      setCustomerInfo({ name: '', phone: '', email: '' });
      setNotes('');
      setSearchTerm('');
      onClose();
      toast.success('Items withdrawn successfully');
    } catch (error) {
      console.error('Error withdrawing items:', error);
      toast.error('Failed to withdraw items');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setLineItems([]);
      setWithdrawalReason('');
      setCustomerInfo({ name: '', phone: '', email: '' });
      setNotes('');
      setSearchTerm('');
    }
  }, [open]);

  return (
    <>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Add Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScanner(true)}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Scan
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search items by name, SKU, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

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

            {/* Customer Information (for sales) */}
            {currentReason?.requiresCustomer && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Customer Information *</Label>
                <div className="grid gap-3">
                  <div>
                    <Label className="text-xs">Name *</Label>
                    <Input
                      placeholder="Customer name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input
                        placeholder="Phone number"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input
                        placeholder="Email address"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
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

            {/* Summary */}
            {lineItems.length > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Items:</span>
                    <span className="font-medium">{totals.totalItems}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Cost:</span>
                    <span className="font-medium">${totals.totalCost.toFixed(2)}</span>
                  </div>
                  {totals.totalProfit > 0 && (
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-sm font-medium text-green-600">Total Profit:</span>
                      <span className="font-medium text-green-600">${totals.totalProfit.toFixed(2)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={isSubmitting || lineItems.length === 0 || !withdrawalReason}
              >
                {isSubmitting ? 'Processing...' : `Withdraw ${lineItems.length} Item${lineItems.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Scanner Overlay */}
      <ScannerOverlay
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onBarcode={handleBarcodeScanned}
      />
    </>
  );
};