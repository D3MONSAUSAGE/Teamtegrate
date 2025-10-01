import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useInventory } from '@/contexts/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { useProductionWorkflow } from '@/hooks/useProductionWorkflow';
import { toast } from '@/hooks/use-toast';
import { Factory, Package } from 'lucide-react';

interface ProductionReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  onSuccess?: () => void;
}

export const ProductionReceiveDialog: React.FC<ProductionReceiveDialogProps> = ({
  open,
  onOpenChange,
  warehouseId,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { items: inventoryItems, createTransaction } = useInventory();
  const { processFinishedGoods } = useProductionWorkflow({ autoCreateBatches: true });
  
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [productionLine, setProductionLine] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [autoBatch, setAutoBatch] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedItemId || quantity <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select an item and enter a valid quantity',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Create incoming transaction for finished goods
      await createTransaction({
        organization_id: user?.organizationId || '',
        item_id: selectedItemId,
        transaction_type: 'in',
        quantity,
        transaction_date: manufacturingDate,
        notes: `Production received - ${notes}${productionLine ? ` (Line: ${productionLine})` : ''}`,
        user_id: user?.id || '',
        warehouse_id: warehouseId,
      });

      // Auto-generate manufacturing batch if enabled
      if (autoBatch) {
        const batch = await processFinishedGoods(
          selectedItemId,
          quantity,
          productionLine
        );

        if (batch) {
          toast({
            title: 'Success',
            description: `Production received and batch ${batch.batch_number} created`,
          });
        } else {
          toast({
            title: 'Partial Success',
            description: 'Production received but batch creation failed',
          });
        }
      } else {
        toast({
          title: 'Success',
          description: `Production of ${quantity} units received`,
        });
      }

      // Reset form
      setSelectedItemId('');
      setQuantity(0);
      setProductionLine('');
      setNotes('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error processing production receipt:', error);
      toast({
        title: 'Error',
        description: 'Failed to process production receipt',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedItem = inventoryItems.find(item => item.id === selectedItemId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-primary" />
            <DialogTitle>Receive Finished Production</DialogTitle>
          </div>
          <DialogDescription>
            Record finished goods from production and optionally auto-generate manufacturing batch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="item">Product *</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Select product..." />
              </SelectTrigger>
              <SelectContent>
                {inventoryItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {item.name} {item.sku && `(${item.sku})`}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Produced *</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                min={0}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Manufacturing Date *</Label>
              <Input
                id="date"
                type="date"
                value={manufacturingDate}
                onChange={(e) => setManufacturingDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="line">Production Line</Label>
            <Select value={productionLine} onValueChange={setProductionLine}>
              <SelectTrigger>
                <SelectValue placeholder="Select production line..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Line-A">Line A</SelectItem>
                <SelectItem value="Line-B">Line B</SelectItem>
                <SelectItem value="Line-C">Line C</SelectItem>
                <SelectItem value="Packaging">Packaging</SelectItem>
                <SelectItem value="Assembly">Assembly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Production Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Batch quality notes, operator details, etc..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <Label htmlFor="auto-batch" className="text-sm font-medium">
                Auto-Generate Manufacturing Batch
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically create tracking batch for traceability
              </p>
            </div>
            <Switch
              id="auto-batch"
              checked={autoBatch}
              onCheckedChange={setAutoBatch}
            />
          </div>

          {selectedItem && quantity > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium">Production Summary</p>
              <p className="text-sm text-muted-foreground mt-1">
                Receiving {quantity} units of {selectedItem.name}
                {productionLine && ` from ${productionLine}`}
                {autoBatch && ' with auto-generated batch'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Processing...' : 'Receive Production'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
