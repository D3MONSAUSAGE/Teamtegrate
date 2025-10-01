import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Printer, Calendar, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { manufacturingBatchesApi, ManufacturingBatch } from '@/contexts/inventory/api';
import { format } from 'date-fns';

interface BatchManagementTableProps {
  onPrintLabels: (batch: ManufacturingBatch) => void;
  onBatchesLoad?: (batches: ManufacturingBatch[]) => void;
}

export const BatchManagementTable: React.FC<BatchManagementTableProps> = ({ 
  onPrintLabels,
  onBatchesLoad 
}) => {
  const [batches, setBatches] = useState<ManufacturingBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await manufacturingBatchesApi.getAll();
      setBatches(data);
      onBatchesLoad?.(data);
    } catch (error) {
      console.error('Failed to load batches:', error);
      toast.error('Failed to load manufacturing batches');
    } finally {
      setLoading(false);
    }
  };

  const getBatchStatus = (batch: ManufacturingBatch) => {
    const unlabeled = batch.quantity_remaining;
    const labelPercent = (batch.quantity_labeled / batch.total_quantity_manufactured) * 100;
    
    if (labelPercent === 0) return { text: 'Not Labeled', variant: 'destructive' as const };
    if (labelPercent < 100) return { text: 'Partially Labeled', variant: 'default' as const };
    return { text: 'Fully Labeled', variant: 'secondary' as const };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading batches...</p>
        </CardContent>
      </Card>
    );
  }

  if (batches.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            No manufacturing batches yet. Create a batch to start tracking production.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {batches.map((batch) => {
        const status = getBatchStatus(batch);
        const itemName = batch.inventory_item?.name || 'Unknown Item';
        const lotNumber = batch.inventory_lot?.lot_number || 'No Lot';
        
        return (
          <Card key={batch.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">{batch.batch_number}</h3>
                      <p className="text-sm text-muted-foreground">{itemName}</p>
                    </div>
                    <Badge variant={status.variant}>{status.text}</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Lot Number</p>
                      <p className="font-medium flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {lotNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Manufacturing Date</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(batch.manufacturing_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Manufactured</p>
                      <p className="font-medium text-lg">{batch.total_quantity_manufactured}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Labels Printed</p>
                      <p className="font-medium text-lg">{batch.quantity_labeled}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Remaining Unlabeled</span>
                        <span className="font-medium">{batch.quantity_remaining} units</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${(batch.quantity_labeled / batch.total_quantity_manufactured) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {batch.production_notes && (
                    <div className="text-xs text-muted-foreground border-l-2 border-border pl-3">
                      {batch.production_notes}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => onPrintLabels(batch)}
                  disabled={batch.quantity_remaining === 0}
                  className="ml-4"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Labels
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
