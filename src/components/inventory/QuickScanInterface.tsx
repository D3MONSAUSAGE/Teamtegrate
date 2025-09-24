import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { InventoryCountItem, InventoryItem } from '@/contexts/inventory/types';
import { 
  Scan, 
  Plus,
  Minus,
  Package,
  CheckCircle,
  X,
  Zap,
  Target
} from 'lucide-react';
import { ScannerOverlay } from './ScannerOverlay';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickScanInterfaceProps {
  countItems: InventoryCountItem[];
  items: InventoryItem[];
  onUpdateCount: (itemId: string, actualQuantity: number) => void;
  onBulkUpdate: (updates: Array<{ itemId: string; actualQuantity: number }>) => Promise<void>;
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
  onUpdateCount,
  onBulkUpdate,
  onClose,
}) => {
  const [scanSessions, setScanSessions] = useState<ScanSession[]>([]);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastScannedItem, setLastScannedItem] = useState<InventoryItem | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
  };

  const handleStartQuickScan = () => {
    setIsScanning(true);
  };
        toast.error('Item not found with this barcode');
        return;
      }

      // Update scan session
      setScanSessions(prev => {
        const existing = prev.find(session => session.itemId === item.id);
        if (existing) {
          return prev.map(session => 
            session.itemId === item.id
              ? { 
                  ...session, 
                  scannedCount: session.scannedCount + currentQuantity,
                  lastScanTime: Date.now()
                }
              : session
          );
        } else {
          return [...prev, {
            itemId: item.id,
            scannedCount: currentQuantity,
            lastScanTime: Date.now()
          }];
        }
      });

      setLastScannedItem(item);
      toast.success(`+${currentQuantity} ${item.name}`, {
        duration: 1500
      });

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Scan failed. Try again.');
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
        onBarcode={() => {}}
        instructions="Scan multiple items quickly"
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