import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, Package, AlertCircle, Calendar, Search, X, Plus, Scan, Zap } from 'lucide-react';
import { inventoryLotsApi, InventoryLot } from '@/contexts/inventory/api/inventoryLots';
import { inventoryItemsApi } from '@/contexts/inventory/api/inventoryItems';
import { inventoryTransactionsApi } from '@/contexts/inventory/api/inventoryTransactions';
import { toast } from 'sonner';
import { warehouseApi, type WarehouseItem } from '@/contexts/warehouse/api/warehouseApi';
import { format, parseISO } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { useScanGun } from '@/hooks/useScanGun';
import { ScannerOverlay } from './ScannerOverlay';
import { BarcodeGenerator } from '@/lib/barcode/barcodeGenerator';

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

interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  unit_cost?: number;
}

interface WithdrawalLine {
  id: string;
  item_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  qty: number;
  unit_price?: number;
  reason: string;
  notes?: string;
}

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
  
  // Line Items for bulk scanning
  const [lineItems, setLineItems] = useState<WithdrawalLine[]>([]);
  
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

  // Search for items when query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedSearchQuery]);

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
      resetForm();
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

  const performSearch = async () => {
    if (!debouncedSearchQuery.trim()) return;
    
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

  const resetForm = () => {
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
    setLineItems([]);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setScanMode(false);
    setShowScanner(false);
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

  const handleItemSelect = (item: InventoryItem | string) => {
    let itemData: InventoryItem;
    
    if (typeof item === 'string') {
      // Legacy support for string itemId
      const warehouseItem = warehouseItems.find(i => i.item_id === item);
      if (!warehouseItem) return;
      itemData = {
        id: warehouseItem.item_id,
        name: warehouseItem.item?.name || '',
        sku: warehouseItem.item?.sku,
        barcode: warehouseItem.item?.barcode,
        unit_cost: 0, // Default to 0 since search results don't include unit_cost
      };
    } else {
      itemData = item;
    }
    
    // Check if item already exists in withdrawal lines
    const existingLine = lineItems.find(line => line.item_id === itemData.id);
    if (existingLine) {
      updateLineItem(existingLine.id, 'qty', existingLine.qty + 1);
      toast.success(`Scanned: ${itemData.name} (Qty: ${existingLine.qty + 1})`);
      return;
    }

    const newLine: WithdrawalLine = {
      id: Date.now().toString(),
      item_id: itemData.id,
      name: itemData.name,
      sku: itemData.sku,
      barcode: itemData.barcode,
      qty: 1,
      unit_price: itemData.unit_cost || 0,
      reason: 'sale', // Default reason
      notes: ''
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

  const updateLineItem = (id: string, field: keyof WithdrawalLine, value: string | number) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
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

  const handleWithdraw = async () => {
    try {
      const validLines = lineItems.filter(item => item.qty > 0 && item.reason);
      if (validLines.length === 0) {
        toast.error('Please add at least one item with quantity > 0 and reason selected');
        return;
      }

      setLoading(true);

      // Process each line item
      for (const line of validLines) {
        // Generate outgoing batch number for traceability
        const outgoingBatchNumber = BarcodeGenerator.generateLotNumber('BATCH');
        
        // Get item lots for FIFO consumption
        const lots = await inventoryLotsApi.getByItemId(line.item_id);
        const availableLots = lots.filter(lot => lot.quantity_remaining > 0);
        
        const { consumption, insufficientStock } = calculateFIFOConsumption(line.qty, availableLots);
        
        if (insufficientStock) {
          toast.error(`Insufficient stock for ${line.name}. Please check available lots.`);
          continue;
        }

        // Update lot quantities based on FIFO consumption
        for (const consume of consumption) {
          await inventoryLotsApi.update(consume.lotId, {
            quantity_remaining: consume.remainingAfter
          });
        }

        // Update warehouse stock
        const warehouseItem = warehouseItems.find(wi => wi.item_id === line.item_id);
        if (warehouseItem && warehouseId) {
          const newStock = Math.max(0, warehouseItem.on_hand - line.qty);
          // TODO: Add warehouse stock update API call
          console.log('Need to update warehouse stock:', { warehouseId, itemId: line.item_id, newStock });
        }

        // Create transaction record with batch number
        await inventoryTransactionsApi.create({
          organization_id: '', // Will be set by RLS
          item_id: line.item_id,
          transaction_type: 'out',
          quantity: -line.qty, // Negative for outgoing
          unit_cost: line.unit_price || undefined,
          transaction_date: new Date().toISOString(),
          reference_number: outgoingBatchNumber, // Store batch number in reference
          notes: `${line.reason}${line.notes ? ` - ${line.notes}` : ''} | Batch: ${outgoingBatchNumber} | Consumed lots: ${consumption.map(c => c.lotNumber).join(', ')}`,
          user_id: '' // Will be set by auth
        });
      }

      await loadWarehouseItems(); // Refresh warehouse items
      
      toast.success(`Successfully withdrew ${validLines.length} item(s) with batch numbers generated for traceability`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error withdrawing stock:', error);
      toast.error('Failed to withdraw stock');
    } finally {
      setLoading(false);
    }
  };

  const calculateFIFOConsumption = (requestedQuantity: number, lots: InventoryLot[] = availableLots) => {
    // Sort lots by expiration date (FIFO - First In, First Out)
    const sortedLots = [...lots].sort((a, b) => {
      if (a.expiration_date && b.expiration_date) {
        return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
      }
      if (a.expiration_date && !b.expiration_date) return -1;
      if (!a.expiration_date && b.expiration_date) return 1;
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

  const totalAvailableStock = selectedItem ? selectedItem.on_hand : 0;
  const { consumption } = formData.quantity > 0 && availableLots.length > 0 ? calculateFIFOConsumption(formData.quantity, availableLots) : { consumption: [] };

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
          {/* Items to Withdraw */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Items to Withdraw
                
                {/* Hardware Scanner Status & Controls */}
                <div className="flex items-center gap-4">
                  {/* Hardware Scanner Status */}
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
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                                ${item.unit_cost.toFixed(2)}
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
                
                {/* Scanning Status */}
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
                              Click scan button above to use device camera
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Line Items */}
              {lineItems.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Scanned Items</Label>
                      {lineItems.map((line) => (
                        <div key={line.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{line.name}</div>
                            {line.sku && (
                              <div className="text-xs text-muted-foreground">SKU: {line.sku}</div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Qty:</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.qty}
                              onChange={(e) => updateLineItem(line.id, 'qty', parseFloat(e.target.value) || 0)}
                              className="w-20 h-8"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Price:</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unit_price || 0}
                              onChange={(e) => updateLineItem(line.id, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-20 h-8"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Reason:</Label>
                            <Select onValueChange={(value) => updateLineItem(line.id, 'reason', value)} value={line.reason}>
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue placeholder="Select" />
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

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(line.id)}
                            className="p-1 h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
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

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleWithdraw} disabled={loading || lineItems.length === 0}>
              {loading ? 'Processing...' : `Withdraw ${lineItems.length} Item(s)`}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>

        {/* Scanner Overlay */}
        {showScanner && (
          <ScannerOverlay
            open={showScanner}
            onBarcode={handleBarcodeScanned}
            onClose={() => setShowScanner(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};