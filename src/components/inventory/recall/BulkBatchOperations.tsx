import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ManufacturingBatch } from '@/contexts/inventory/api';
import { useBatchConsolidation } from '@/hooks/useBatchConsolidation';
import { Merge, Split, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BulkBatchOperationsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batches: ManufacturingBatch[];
  onSuccess?: () => void;
}

export const BulkBatchOperations: React.FC<BulkBatchOperationsProps> = ({
  open,
  onOpenChange,
  batches,
  onSuccess,
}) => {
  const { consolidateBatches, splitBatch } = useBatchConsolidation();
  const [operation, setOperation] = useState<'consolidate' | 'split' | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [consolidatedName, setConsolidatedName] = useState('');
  const [splitQuantities, setSplitQuantities] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const selectedBatches = batches.filter(b => selectedBatchIds.includes(b.id));
  const totalQuantity = selectedBatches.reduce((sum, b) => sum + b.quantity_remaining, 0);

  const handleToggleBatch = (batchId: string) => {
    setSelectedBatchIds(prev =>
      prev.includes(batchId)
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  const handleConsolidate = async () => {
    if (selectedBatchIds.length < 2) {
      toast({
        title: 'Selection Required',
        description: 'Select at least 2 batches to consolidate',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      await consolidateBatches(selectedBatchIds, consolidatedName || undefined);
      onOpenChange(false);
      onSuccess?.();
      setSelectedBatchIds([]);
      setConsolidatedName('');
    } finally {
      setProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (selectedBatchIds.length !== 1) {
      toast({
        title: 'Selection Required',
        description: 'Select exactly 1 batch to split',
        variant: 'destructive',
      });
      return;
    }

    const quantities = splitQuantities.split(',').map(q => parseInt(q.trim())).filter(q => !isNaN(q));
    if (quantities.length === 0) {
      toast({
        title: 'Invalid Input',
        description: 'Enter comma-separated quantities (e.g., 100,200,150)',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      await splitBatch(selectedBatchIds[0], quantities);
      onOpenChange(false);
      onSuccess?.();
      setSelectedBatchIds([]);
      setSplitQuantities('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Batch Operations</DialogTitle>
          <DialogDescription>
            Consolidate multiple batches or split a single batch into smaller units
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Operation Selection */}
          {!operation && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => setOperation('consolidate')}
              >
                <Merge className="h-6 w-6" />
                <div className="text-center">
                  <p className="font-semibold">Consolidate Batches</p>
                  <p className="text-xs text-muted-foreground">Merge multiple batches</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => setOperation('split')}
              >
                <Split className="h-6 w-6" />
                <div className="text-center">
                  <p className="font-semibold">Split Batch</p>
                  <p className="text-xs text-muted-foreground">Divide into smaller batches</p>
                </div>
              </Button>
            </div>
          )}

          {/* Batch Selection */}
          {operation && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    Select Batches ({selectedBatchIds.length} selected)
                  </Label>
                  <Badge variant="secondary">
                    Total: {totalQuantity} units
                  </Badge>
                </div>

                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {batches
                    .filter(b => b.quantity_remaining > 0)
                    .map((batch) => (
                      <div
                        key={batch.id}
                        className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedBatchIds.includes(batch.id)}
                          onCheckedChange={() => handleToggleBatch(batch.id)}
                        />
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{batch.batch_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {batch.inventory_item?.name || 'Unknown Item'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{batch.quantity_remaining} units</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(batch.manufacturing_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Consolidate Options */}
              {operation === 'consolidate' && (
                <div className="space-y-2">
                  <Label htmlFor="consol-name">Consolidated Batch Name (Optional)</Label>
                  <Input
                    id="consol-name"
                    value={consolidatedName}
                    onChange={(e) => setConsolidatedName(e.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                  <p className="text-xs text-muted-foreground">
                    Will consolidate {selectedBatchIds.length} batches into one with total {totalQuantity} units
                  </p>
                </div>
              )}

              {/* Split Options */}
              {operation === 'split' && (
                <div className="space-y-2">
                  <Label htmlFor="split-qty">Split Quantities (comma-separated)</Label>
                  <Input
                    id="split-qty"
                    value={splitQuantities}
                    onChange={(e) => setSplitQuantities(e.target.value)}
                    placeholder="e.g., 100,200,150"
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {totalQuantity} units
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (operation) {
                setOperation(null);
                setSelectedBatchIds([]);
              } else {
                onOpenChange(false);
              }
            }}
            disabled={processing}
          >
            {operation ? 'Back' : 'Cancel'}
          </Button>
          {operation && (
            <Button
              onClick={operation === 'consolidate' ? handleConsolidate : handleSplit}
              disabled={processing || selectedBatchIds.length === 0}
            >
              {processing ? 'Processing...' : operation === 'consolidate' ? 'Consolidate' : 'Split'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
