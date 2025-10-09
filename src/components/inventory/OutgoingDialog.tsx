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
import { ShoppingCart, Package, AlertCircle, Calendar, Search, X, Plus, Scan, Zap, DollarSign, Users } from 'lucide-react';
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
  onWithdrawSuccess?: () => void;
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
  on_hand?: number; // Warehouse stock level
  stock_status?: 'available' | 'unavailable'; // Stock status from hybrid search
  is_in_warehouse?: boolean; // Whether item exists in warehouse
  category?: { name: string; };
  base_unit?: { name: string; abbreviation: string; };
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
  warehouseId,
  onWithdrawSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WarehouseItem | null>(null);
  const [warehouseName, setWarehouseName] = useState<string>('');
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

  // Load warehouse name and clear search when warehouse changes
  useEffect(() => {
    const loadWarehouseName = async () => {
      if (warehouseId) {
        try {
          const warehouses = await warehouseApi.listWarehouses();
          const warehouse = warehouses.find(w => w.id === warehouseId);
          setWarehouseName(warehouse?.name || 'Warehouse');
        } catch (error) {
          console.error('Error loading warehouse name:', error);
          setWarehouseName('');
        }
      }
    };
    
    loadWarehouseName();
    // Clear search results when warehouse changes
    setSearchResults([]);
    setSearchQuery('');
  }, [warehouseId]);

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
    if (!debouncedSearchQuery.trim() || !warehouseId) return;
    
    try {
      setSearchLoading(true);
      // Use warehouse-specific search to only show items available in THIS warehouse
      const results = await warehouseApi.searchWarehouseItems(warehouseId, debouncedSearchQuery);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching items:', error);
      toast.error('Failed to search items');
    } finally {
      setSearchLoading(false);
    }
  };

  // Refresh search results with current stock levels
  const refreshSearchResults = async () => {
    if (searchQuery.trim() && warehouseId) {
      await performSearch();
    }
  };

  // Handle barcode scan (from hardware scanner or camera)
  const handleBarcodeScanned = async (barcode: string) => {
    if (!warehouseId) {
      toast.error('Warehouse not selected');
      return;
    }

    try {
      // Search for item by barcode in THIS warehouse only
      const results = await warehouseApi.searchWarehouseItems(warehouseId, barcode);
      
      if (results.length === 0) {
        toast.error(`No item found with barcode "${barcode}" in this warehouse`);
        return;
      }
      
      // Auto-select first result (barcode search is precise)
      const item = results[0];
      
      // Items from searchWarehouseItems always have stock > 0, but double-check
      if (!item.on_hand || item.on_hand <= 0) {
        toast.error(`Item "${item.name}" not available in warehouse`);
        return;
      }
      
      handleItemSelect(item);
      
      // Show success feedback with stock info
      toast.success(`Scanned: ${item.name} (Stock: ${item.on_hand})`);
      
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
        on_hand: warehouseItem.on_hand,
      };
    } else {
      itemData = item;
    }
    
    // Prevent selection of items with no stock
    if (itemData.on_hand <= 0) {
      toast.error(`Cannot add "${itemData.name}" - no stock available in warehouse (Stock: ${itemData.on_hand || 0})`);
      return;
    }
    
    // Check if item already exists in withdrawal lines
    const existingLine = lineItems.find(line => line.item_id === itemData.id);
    if (existingLine) {
      updateLineItem(existingLine.id, 'qty', existingLine.qty + 1);
      toast.success(`Updated: ${itemData.name} (Qty: ${existingLine.qty + 1})`);
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
    
    toast.success(`Added: ${itemData.name} (Stock: ${itemData.on_hand})`);
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
          try {
            const stockUpdateResult = await warehouseApi.updateWarehouseStock(warehouseId, line.item_id, -line.qty);
            if (!stockUpdateResult) {
              throw new Error('Failed to update warehouse stock - insufficient permissions or stock');
            }
          } catch (stockError) {
            console.error('Failed to update warehouse stock:', stockError);
            toast.error(`Failed to update warehouse stock for ${line.name}: ${stockError instanceof Error ? stockError.message : 'Unknown error'}`);
            throw stockError; // Stop processing if stock update fails
          }
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
          notes: `${line.reason}${line.notes ? ` - ${line.notes}` : ''} | Batch: ${outgoingBatchNumber} | Consumed lots: ${consumption.map(c => c.lotNumber).join(', ')} | Warehouse: ${warehouseId}`,
          user_id: '' // Will be set by auth
        });
      }

      await loadWarehouseItems(); // Refresh warehouse items
      
      // Clear and refresh search results to show updated stock levels
      setSearchResults([]);
      await refreshSearchResults();
      
      // Notify parent component to refresh its data
      if (onWithdrawSuccess) {
        onWithdrawSuccess();
      }
      
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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Enhanced Header */}
        <DialogHeader className="space-y-4 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Warehouse Stock Withdrawal
              </DialogTitle>
              <p className="text-muted-foreground text-sm">
                {warehouseName && <span className="font-medium">{warehouseName} • </span>}
                Process sales, waste, transfers, and other inventory movements with full lot traceability
              </p>
            </div>
            
            {/* Scanner Status in Header */}
            {scannerConnected && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">Hardware Scanner Active</span>
                <Zap className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
          
          {/* Quick Stats */}
          {lineItems.length > 0 && (
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{lineItems.length}</div>
                <div className="text-xs text-muted-foreground">Items</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-accent">
                  {lineItems.reduce((sum, item) => sum + item.qty, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Qty</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-secondary">
                  ${lineItems.reduce((sum, item) => sum + ((item.unit_price || 0) * item.qty), 0).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Total Value</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {new Set(lineItems.map(item => item.reason)).size}
                </div>
                <div className="text-xs text-muted-foreground">Reasons</div>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-12 gap-6 h-full">
            
            {/* Left Panel - Search & Scan (4 columns) */}
            <div className="col-span-4 space-y-6 overflow-y-auto">
              {/* Scanning Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Scan className="h-5 w-5 text-primary" />
                      Item Selection
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="scan-mode" className="text-sm font-medium">
                        Scan Mode
                      </Label>
                      <Switch
                        id="scan-mode"
                        checked={scanMode}
                        onCheckedChange={setScanMode}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                   {/* Search Input */}
                   <div className="space-y-3">
                     {/* Stock Filter */}
                     <div className="flex items-center gap-2">
                       <Label className="text-xs font-medium">Show:</Label>
                       <div className="flex gap-1">
                         <Badge 
                           variant="outline" 
                           className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                           onClick={() => {/* Filter logic will be added */}}
                         >
                           All Items
                         </Badge>
                         <Badge 
                           variant="outline" 
                           className="cursor-pointer hover:bg-green-100 hover:text-green-800 text-xs"
                           onClick={() => {/* Filter logic will be added */}}
                         >
                           Available Only
                         </Badge>
                         <Badge 
                           variant="outline" 
                           className="cursor-pointer hover:bg-gray-100 hover:text-gray-800 text-xs"
                           onClick={() => {/* Filter logic will be added */}}
                         >
                           Out of Stock
                         </Badge>
                       </div>
                     </div>
                     
                     <div className="relative">
                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input
                         placeholder={
                           scanMode && scannerConnected 
                             ? "Hardware scanner ready..." 
                             : scanMode 
                               ? "Scan with camera or search..." 
                               : "Search by name, SKU, barcode..."
                         }
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         onFocus={() => {
                           if (searchResults.length > 0) setShowResults(true);
                         }}
                         className="pl-10 h-12"
                         disabled={scanMode && !searchQuery}
                       />
                       
                       {/* Camera Scan Button */}
                       {scanMode && (
                         <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           onClick={() => setShowScanner(true)}
                           className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2"
                         >
                           <Scan className="h-4 w-4" />
                         </Button>
                       )}
                     </div>
                   </div>
                  
                   {/* Search Results */}
                   {showResults && searchResults.length > 0 && (
                     <Card className="border shadow-lg max-h-80 overflow-y-auto">
                       <CardContent className="p-2">
                         {searchResults.map((item) => {
                           const isAvailable = item.on_hand > 0;
                           const stockStatus = item.stock_status || (isAvailable ? 'available' : 'unavailable');
                           
                           return (
                             <div
                               key={item.id}
                               className={`p-3 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                                 isAvailable 
                                   ? 'hover:bg-muted' 
                                   : 'bg-muted/30 cursor-not-allowed'
                               }`}
                               onClick={() => {
                                 if (isAvailable) {
                                   handleItemSelect(item);
                                 } else {
                                   toast.error(`"${item.name}" is not available in this warehouse`);
                                 }
                               }}
                             >
                               <div className="flex-1">
                                 <div className={`font-medium ${!isAvailable ? 'text-muted-foreground' : ''}`}>
                                   {item.name}
                                 </div>
                                 <div className="text-sm text-muted-foreground flex gap-4 items-center">
                                   {item.sku && <span>SKU: {item.sku}</span>}
                                   {item.barcode && <span>Barcode: {item.barcode}</span>}
                                 </div>
                               </div>
                               
                               <div className="flex items-center gap-2">
                                 {/* Stock Status Badge */}
                                 <Badge 
                                   variant={stockStatus === 'available' ? 'default' : 'secondary'}
                                   className={`text-xs ${
                                     stockStatus === 'available' 
                                       ? 'bg-green-100 text-green-800 border-green-200' 
                                       : 'bg-gray-100 text-gray-600 border-gray-200'
                                   }`}
                                 >
                                   {stockStatus === 'available' 
                                     ? `Stock: ${item.on_hand}` 
                                     : 'Not Available'
                                   }
                                 </Badge>
                                 
                                 {/* Selection Icon */}
                                 {isAvailable ? (
                                   <Plus className="h-4 w-4 text-primary" />
                                 ) : (
                                   <X className="h-4 w-4 text-muted-foreground" />
                                 )}
                               </div>
                             </div>
                           );
                         })}
                       </CardContent>
                     </Card>
                   )}
                  
                  {/* Loading indicator */}
                  {searchLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => setScanMode(!scanMode)}>
                        <Scan className="h-4 w-4 mr-2" />
                        {scanMode ? 'Disable' : 'Enable'} Scan
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                          setShowResults(false);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Search
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Withdrawal Reasons Reference */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    Available Withdrawal Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {withdrawalReasons.map((reason) => (
                      <Badge key={reason.value} variant="outline" className="justify-center py-1">
                        {reason.label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Line Items & Summary (8 columns) */}
            <div className="col-span-8 space-y-6 overflow-y-auto">
              
              {/* Line Items Section */}
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Selected Items
                    {lineItems.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {lineItems.length} items
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lineItems.length === 0 ? (
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-12 text-center">
                      <Package className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
                      <h3 className="text-xl font-semibold text-muted-foreground mb-2">Ready to Process Withdrawals</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Use the search or scanner on the left to add items for withdrawal. Each scanned item will appear here with full control over quantities, pricing, and withdrawal reasons.
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Scan className="h-4 w-4" />
                          <span>Hardware & Camera Scanning</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Search className="h-4 w-4" />
                          <span>Manual Search</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>FIFO Lot Tracking</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Line Items as Cards */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {lineItems.map((line) => (
                          <Card key={line.id} className="border-l-4 border-l-primary/20">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-12 gap-4 items-center">
                                {/* Item Info (4 cols) */}
                                <div className="col-span-4">
                                  <div className="font-semibold text-lg">{line.name}</div>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    {line.sku && <div>SKU: {line.sku}</div>}
                                    {line.barcode && <div>Barcode: {line.barcode}</div>}
                                  </div>
                                </div>
                                
                                {/* Quantity (2 cols) */}
                                <div className="col-span-2">
                                  <Label className="text-xs font-medium">Quantity</Label>
                                  <Input
                                    type="number"
                                    value={line.qty}
                                    onChange={(e) => updateLineItem(line.id, 'qty', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="h-9"
                                    min="0"
                                  />
                                </div>
                                
                                {/* Unit Price (2 cols) */}
                                <div className="col-span-2">
                                  <Label className="text-xs font-medium">Unit Price</Label>
                                  <Input
                                    type="number"
                                    value={line.unit_price || 0}
                                    onChange={(e) => updateLineItem(line.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                    className="h-9"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                
                                {/* Reason (3 cols) */}
                                <div className="col-span-3">
                                  <Label className="text-xs font-medium">Withdrawal Reason</Label>
                                  <Select
                                    value={line.reason}
                                    onValueChange={(value) => updateLineItem(line.id, 'reason', value)}
                                  >
                                    <SelectTrigger className="h-9">
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
                                
                                {/* Total & Remove (1 col) */}
                                <div className="col-span-1 text-right">
                                  <div className="font-bold text-lg text-primary mb-2">
                                    ${((line.unit_price || 0) * line.qty).toFixed(2)}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLineItem(line.id)}
                                    className="text-destructive hover:text-destructive/80 p-1"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom Section - Customer Info & Summary */}
        {lineItems.length > 0 && (
          <div className="border-t pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-6">
              
              {/* Customer Information (for sales) */}
              {lineItems.some(item => item.reason === 'sale') && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="customer_name">Customer Name</Label>
                      <Input
                        id="customer_name"
                        value={formData.customer_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                        placeholder="Enter customer name for sales"
                        className="h-10"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transaction Notes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Transaction Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add notes about this withdrawal transaction..."
                    rows={3}
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {lineItems.length > 0 && (
                  <span>
                    Ready to withdraw {lineItems.filter(item => item.qty > 0 && item.reason).length} of {lineItems.length} items
                  </span>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleWithdraw} 
                  disabled={loading || lineItems.length === 0 || lineItems.every(item => item.qty === 0 || !item.reason)}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 px-6"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                      Processing Withdrawal...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Process Withdrawal ({lineItems.filter(item => item.qty > 0 && item.reason).length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Available Lots Information - Only show when relevant */}
        {selectedItem && availableLots.length > 0 && formData.quantity > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                FIFO Lot Consumption Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableLots.map((lot) => {
                  const isConsumed = consumption.some(c => c.lotId === lot.id);
                  const consumedAmount = consumption.find(c => c.lotId === lot.id)?.quantity || 0;
                  
                  return (
                    <div 
                      key={lot.id} 
                      className={`p-3 rounded-lg border transition-colors ${
                        isConsumed ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={isConsumed ? "default" : "outline"}>
                          {lot.lot_number}
                        </Badge>
                        {isExpired(lot.expiration_date) && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        {isExpiringSoon(lot.expiration_date) && !isExpired(lot.expiration_date) && (
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                        )}
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div>Available: {lot.quantity_remaining}</div>
                        {lot.expiration_date && (
                          <div className={`text-xs ${
                            isExpired(lot.expiration_date) ? 'text-destructive' :
                            isExpiringSoon(lot.expiration_date) ? 'text-orange-600' :
                            'text-muted-foreground'
                          }`}>
                            Exp: {format(parseISO(lot.expiration_date), 'MMM d, yyyy')}
                          </div>
                        )}
                        {isConsumed && (
                          <div className="text-primary font-medium">
                            Will consume: {consumedAmount}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      {/* Scanner Overlay */}
      <ScannerOverlay
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onBarcode={handleBarcodeScanned}
      />
    </Dialog>
  );
};