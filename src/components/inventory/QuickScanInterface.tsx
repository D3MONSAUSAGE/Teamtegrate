import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { InventoryCountItem, InventoryItem, InventoryCategory, InventoryUnit } from '@/contexts/inventory/types';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Scan, 
  Plus,
  Minus,
  Package,
  CheckCircle,
  X,
  Zap,
  Target,
  Undo2
} from 'lucide-react';
import { ScannerOverlay } from './ScannerOverlay';
import { CreateItemDialog } from './CreateItemDialog';
import { inventoryItemsApi } from '@/contexts/inventory/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickScanInterfaceProps {
  countItems: InventoryCountItem[];
  items: InventoryItem[];
  categories: InventoryCategory[];
  units: InventoryUnit[];
  activeCountId?: string;
  onUpdateCount: (itemId: string, actualQuantity: number) => void;
  onBulkUpdate: (updates: Array<{ itemId: string; actualQuantity: number }>) => Promise<void>;
  onItemCreated: (item: InventoryItem) => void;
  onClose: () => void;
}

interface ScanSession {
  itemId: string;
  scannedCount: number;
  lastScanTime: number;
}

export const QuickScanInterface: React.FC<QuickScanInterfaceProps> = ({
  countItems,
  items,
  categories,
  units,
  activeCountId,
  onUpdateCount,
  onBulkUpdate,
  onItemCreated,
  onClose,
}) => {
  const { user } = useAuth();
  const [scanSessions, setScanSessions] = useState<ScanSession[]>([]);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastScannedItem, setLastScannedItem] = useState<InventoryItem | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState<string>('');
  const [lastScanTime, setLastScanTime] = useState(0);

  const handleScan = () => {
    setIsScanning(true);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    const now = Date.now();
    
    // Debounce duplicate scans within 750ms
    if (now - lastScanTime < 750) return;
    setLastScanTime(now);

    try {
      // Look up item by barcode
      const item = await inventoryItemsApi.getByBarcode(barcode);
      
      if (!item) {
        // Unknown barcode - show create dialog
        setUnknownBarcode(barcode);
        setIsScanning(false);
        setShowCreateDialog(true);
        toast.error(`Unknown barcode: ${barcode}`);
        return;
      }

      // Find or create scan session
      const existingSession = scanSessions.find(s => s.itemId === item.id);
      if (existingSession) {
        // Increment existing session
        setScanSessions(prev => 
          prev.map(session => 
            session.itemId === item.id
              ? { ...session, scannedCount: session.scannedCount + currentQuantity, lastScanTime: now }
              : session
          )
        );
      } else {
        // Create new session
        setScanSessions(prev => [...prev, {
          itemId: item.id,
          scannedCount: currentQuantity,
          lastScanTime: now
        }]);
      }

      setLastScannedItem(item);
      
      // Haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      toast.success(`Scanned: ${item.name} +${currentQuantity}`, {
        action: {
          label: 'Undo',
          onClick: () => undoLastScan(item.id)
        }
      });
      
    } catch (error) {
      console.error('Barcode lookup failed:', error);
      toast.error('Failed to process barcode scan');
    }
  };

  const undoLastScan = (itemId: string) => {
    setScanSessions(prev => {
      const session = prev.find(s => s.itemId === itemId);
      if (!session) return prev;
      
      if (session.scannedCount <= currentQuantity) {
        // Remove session entirely
        return prev.filter(s => s.itemId !== itemId);
      } else {
        // Decrement count
        return prev.map(s => 
          s.itemId === itemId 
            ? { ...s, scannedCount: s.scannedCount - currentQuantity }
            : s
        );
      }
    });
    toast.success('Scan undone');
  };

  const handleItemCreated = async (itemData: any) => {
    try {
      console.log('🔄 Creating item from QuickScan interface:', itemData);
      
      // Call the API directly here since CreateItemDialog just passes data back
      const newItem = await inventoryItemsApi.create({
        ...itemData,
        organization_id: user?.organizationId || '',
        created_by: user?.id || ''
      });
      
      if (newItem) {
        console.log('✅ Item created successfully from QuickScan:', newItem);
        onItemCreated(newItem);
        toast.success(`${newItem.name} created successfully`);
        setShowCreateDialog(false);
        setUnknownBarcode('');
        
        // Auto-scan the newly created item
        setTimeout(() => {
          if (unknownBarcode) {
            handleBarcodeScanned(unknownBarcode);
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ Failed to create item from QuickScan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create item');
    }
  };

  const adjustQuantity = (sessionId: string, adjustment: number) => {
    setScanSessions(prev => 
      prev.map(session => 
        session.itemId === sessionId
          ? { 
              ...session, 
              scannedCount: Math.max(0, session.scannedCount + adjustment)
            }
          : session
      ).filter(session => session.scannedCount > 0)
    );
  };

  const removeSession = (sessionId: string) => {
    setScanSessions(prev => prev.filter(session => session.itemId !== sessionId));
  };

  const handleBulkSubmit = async () => {
    if (scanSessions.length === 0) return;

    setIsSubmitting(true);
    try {
      const updates = scanSessions.map(session => ({
        itemId: session.itemId,
        actualQuantity: session.scannedCount
      }));

      await onBulkUpdate(updates);
      toast.success(`Updated ${scanSessions.length} items`);
      setScanSessions([]);
      setLastScannedItem(null);
    } catch (error) {
      console.error('Bulk update failed:', error);
      toast.error('Failed to save updates');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getItemById = (itemId: string) => {
    return items.find(item => item.id === itemId);
  };

  const totalScannedItems = scanSessions.reduce((total, session) => total + session.scannedCount, 0);

  return (
    <>
      <ScannerOverlay
        open={isScanning}
        onClose={() => setIsScanning(false)}
        onBarcode={handleBarcodeScanned}
        instructions="Scan multiple items quickly"
      />
      
      <CreateItemDialog
        open={showCreateDialog}
        onClose={() => {setShowCreateDialog(false); setUnknownBarcode('');}}
        onItemCreated={handleItemCreated}
        categories={categories}
        units={units}
        prefilledBarcode={unknownBarcode}
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Quick Scan</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {totalScannedItems} items
              </Badge>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Scan Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentQuantity(Math.max(1, currentQuantity - 1))}
                    disabled={currentQuantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{currentQuantity}</div>
                    <div className="text-sm text-muted-foreground">per scan</div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentQuantity(currentQuantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Scan Button */}
                <Button 
                  size="lg" 
                  className="w-full h-16 text-lg"
                  onClick={handleScan}
                  disabled={isScanning}
                >
                  <Scan className={cn("h-6 w-6 mr-3", isScanning && "animate-pulse")} />
                  {isScanning ? 'Scanning...' : 'Scan Barcode'}
                </Button>

                {/* Last Scanned */}
                {lastScannedItem && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 text-primary">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">Last: {lastScannedItem.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scanned Items */}
          {scanSessions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>Scanned Items</span>
                  <Button
                    onClick={handleBulkSubmit}
                    disabled={isSubmitting || scanSessions.length === 0}
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {scanSessions.map((session) => {
                  const item = getItemById(session.itemId);
                  if (!item) return null;

                  return (
                    <div key={session.itemId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.sku && `SKU: ${item.sku}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => adjustQuantity(session.itemId, -1)}
                          disabled={session.scannedCount <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="min-w-[3rem] text-center font-semibold">
                          {session.scannedCount}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => adjustQuantity(session.itemId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeSession(session.itemId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {scanSessions.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  Scan barcodes to add items quickly
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};