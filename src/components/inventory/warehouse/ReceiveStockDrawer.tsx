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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Search, Truck, X, Package, Plus, Scan, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { warehouseApi, type Warehouse } from '@/contexts/warehouse/api/warehouseApi';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useScanGun } from '@/hooks/useScanGun';
import { ScannerOverlay } from '../ScannerOverlay';
import { inventoryLotsApi } from '@/contexts/inventory/api/inventoryLots';

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

interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  unit_cost?: number;
}

interface ReceiveStockDrawerProps {
  warehouseId?: string;
  onReceiptPosted?: () => void;
}

export const ReceiveStockDrawer: React.FC<ReceiveStockDrawerProps> = ({ 
  warehouseId, 
  onReceiptPosted 
}) => {
  // Force rebuild - removed shipment selector dependencies
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  // Basic receiving state
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<ReceiveLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Item search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Scanning state
  const [scanMode, setScanMode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerConnected, setScannerConnected] = useState(false);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load warehouse when warehouseId changes
  useEffect(() => {
    if (warehouseId && open) {
      loadWarehouse();
    }
  }, [warehouseId, open]);

  // Search for items when query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim() && user?.organizationId) {
      performSearch();
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedSearchQuery, user?.organizationId]);

  const loadWarehouse = async () => {
    if (!warehouseId) return;
    try {
      // Get warehouse by ID - we already have the correct warehouseId from props
      const { data, error } = await supabase
        .from('warehouses')
        .select(`
          *,
          team:teams(id, name)
        `)
        .eq('id', warehouseId)
        .single();
      
      if (error) throw error;
      setWarehouse(data);
    } catch (error) {
      console.error('Error loading warehouse:', error);
      toast.error('Failed to load warehouse details');
    }
  };

  const performSearch = async () => {
    if (!user?.organizationId || !debouncedSearchQuery.trim()) return;
    
    try {
      setSearchLoading(true);
      const results = await warehouseApi.searchInventoryItems(debouncedSearchQuery);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching items:', error);
      toast.error('Failed to search items');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle barcode scan (from hardware scanner or camera)
  const handleBarcodeScanned = async (barcode: string) => {
    try {
      // Search for item by barcode
      const results = await warehouseApi.searchInventoryItems(barcode);
      
      if (results.length === 0) {
        toast.error(`No item found with barcode: ${barcode}`);
        return;
      }
      
      // Auto-select first result (barcode search is precise)
      const item = results[0];
      handleItemSelect(item);
      
      // Show success feedback
      toast.success(`Scanned: ${item.name}`);
      
      // Haptic feedback on mobile
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

  // Update scanner connected state and auto-enable scan mode for hardware scanners
  useEffect(() => {
    setScannerConnected(hardwareScannerConnected);
    
    // Auto-enable scan mode when hardware scanner is detected
    if (hardwareScannerConnected && open) {
      setScanMode(true);
    }
  }, [hardwareScannerConnected, open]);

  const handleItemSelect = (item: InventoryItem) => {
    // Check if item already exists in lines
    const existingLine = lineItems.find(line => line.item_id === item.id);
    if (existingLine) {
      updateLineItem(existingLine.id, 'qty', existingLine.qty + 1);
      toast.success(`Scanned: ${item.name} (Qty: ${existingLine.qty + 1})`);
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
    
    // Clear search
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
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

  const generateLotNumber = () => {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `LOT-${date}-${random}`;
  };

  const handleSubmit = async () => {
    if (!warehouseId) {
      toast.error('No warehouse selected');
      return;
    }

    if (!user?.id || !user?.organizationId) {
      toast.error('Authentication required. Please log in again.');
      return;
    }

    const validLines = lineItems.filter(item => item.qty > 0);
    if (validLines.length === 0) {
      toast.error('Please add at least one item with quantity > 0');
      return;
    }

    console.log('[WAREHOUSE_RECEIPT] Starting receipt creation...', {
      warehouseId,
      userId: user.id,
      organizationId: user.organizationId,
      validLinesCount: validLines.length
    });

    try {
      setSubmitting(true);

      // Step 1: Create receipt
      console.log('[WAREHOUSE_RECEIPT] Creating receipt...');
      const receipt = await warehouseApi.createReceipt(warehouseId, reference);
      console.log('[WAREHOUSE_RECEIPT] Receipt created:', receipt.id);

      // Step 2: Generate lot number for this receipt
      const sharedLotNumber = generateLotNumber();
      console.log('[WAREHOUSE_RECEIPT] Generated lot number:', sharedLotNumber);

      // Step 3: Create lot records for each item with proper auth data
      console.log('[WAREHOUSE_RECEIPT] Creating lot records...');
      for (const line of validLines) {
        console.log('[WAREHOUSE_RECEIPT] Creating lot for item:', {
          itemId: line.item_id,
          qty: line.qty,
          lotNumber: sharedLotNumber
        });
        
        await inventoryLotsApi.create({
          organization_id: user.organizationId, // Use actual organization ID
          item_id: line.item_id,
          lot_number: sharedLotNumber,
          manufacturing_date: null,
          expiration_date: null,
          quantity_received: line.qty,
          quantity_remaining: line.qty,
          cost_per_unit: line.unit_cost || null,
          supplier_info: null,
          notes: `Receipt: ${receipt.id}${notes ? ` | ${notes}` : ''}`,
          is_active: true,
          created_by: user.id, // Use actual user ID
          shipment_id: null
        });
      }
      console.log('[WAREHOUSE_RECEIPT] All lots created successfully');

      // Step 4: Add lines to receipt (include all lines with qty > 0, regardless of unit_cost)
      console.log('[WAREHOUSE_RECEIPT] Adding receipt lines...', validLines.map(l => ({
        item_id: l.item_id,
        qty: l.qty,
        unit_cost: l.unit_cost || 0,
        name: l.name,
        lot_number: sharedLotNumber
      })));
      
      for (const line of validLines) {
        await warehouseApi.addReceiptLine(receipt.id, {
          itemId: line.item_id,
          qty: line.qty,
          unitCost: line.unit_cost || 0 // Default to 0 if no unit cost
        });
      }
      console.log('[WAREHOUSE_RECEIPT] All receipt lines added');

      // Step 5: Post the receipt (this updates warehouse_items.on_hand)
      console.log('[WAREHOUSE_RECEIPT] Posting receipt...');
      await warehouseApi.postReceipt(receipt.id);
      console.log('[WAREHOUSE_RECEIPT] Receipt posted successfully');

      toast.success(`Receipt ${receipt.id.slice(0, 8)} posted successfully with lot ${sharedLotNumber}!`);
      
      // Reset form
      resetForm();
      setOpen(false);
      
      // Trigger refresh of warehouse stock
      if (onReceiptPosted) {
        onReceiptPosted();
      }
    } catch (error) {
      console.error('[WAREHOUSE_RECEIPT] ❌ Error posting receipt:', error);
      
      // Enhanced error reporting for debugging
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('[WAREHOUSE_RECEIPT] Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      } else if (typeof error === 'object' && error !== null) {
        console.error('[WAREHOUSE_RECEIPT] Error object:', error);
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('details' in error) {
          errorMessage = String(error.details);
        }
      }
      
      toast.error(`Failed to post receipt: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setReference('');
    setNotes('');
    setLineItems([]);
    setReceivedDate(new Date().toISOString().split('T')[0]);
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

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Receive Inventory
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
                  <Label htmlFor="reference">Reference</Label>
                  <Input
                    id="reference"
                    placeholder="PO number, invoice, etc."
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
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
                
                {/* Item Search/Scan */}
                <div className="space-y-3">
                  {/* Search Input with Results */}
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
                              className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer"
                            >
                              <div className="flex-1">
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground flex gap-2">
                                  {item.sku && <span>SKU: {item.sku}</span>}
                                  {item.barcode && <span>| {item.barcode}</span>}
                                </div>
                              </div>
                              {item.unit_cost && (
                                <div className="text-sm font-medium">
                                  {formatCurrency(item.unit_cost)}
                                </div>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* No Results */}
                    {showResults && searchResults.length === 0 && debouncedSearchQuery && !searchLoading && (
                      <Card className="absolute top-full left-0 right-0 z-50 mt-1 border shadow-lg bg-background">
                        <CardContent className="p-4 text-center text-muted-foreground">
                          No items found matching "{debouncedSearchQuery}"
                        </CardContent>
                      </Card>
                    )}
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

                {lineItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Items Added</h3>
                    <p className="text-muted-foreground mb-4">
                      Search for items above to add them to this receipt
                    </p>
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
                  {submitting ? 'Posting Receipt...' : `Post Receipt (${lineItems.length} items)`}
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

      {/* Scanner Overlay */}
      <ScannerOverlay
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onBarcode={handleBarcodeScanned}
        continuous={true}
        instructions="Scan item barcodes to add them to the receipt"
      />
    </>
  );
};