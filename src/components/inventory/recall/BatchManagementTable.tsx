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
  selectedTeamId?: string | null;
}

export const BatchManagementTable: React.FC<BatchManagementTableProps> = ({ 
  onPrintLabels,
  onBatchesLoad,
  selectedTeamId
}) => {
  const [batches, setBatches] = useState<ManufacturingBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, [selectedTeamId]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await manufacturingBatchesApi.getAll();
      
      // Filter by team if selectedTeamId is provided
      const filteredData = selectedTeamId && selectedTeamId !== 'all'
        ? data.filter(batch => {
            // Check if batch's item belongs to the selected team
            const itemTeamId = batch.item?.team_id;
            console.log(`Batch ${batch.batch_number} - Item team: ${itemTeamId}, Selected: ${selectedTeamId}`);
            return itemTeamId === selectedTeamId;
          })
        : data;
      
      setBatches(filteredData);
      onBatchesLoad?.(filteredData);
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
        const itemName = batch.item?.name || 'Unknown Item';
        const lotNumber = batch.inventory_lot?.lot_number || 'No Lot';
        
        return (
          <Card key={batch.id}>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Package className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base md:text-lg truncate">{batch.batch_number}</h3>
                        <p className="text-sm text-muted-foreground truncate">{itemName}</p>
                      </div>
                    </div>
                    <Badge variant={status.variant} className="self-start sm:self-center whitespace-nowrap">
                      {status.text}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Lot Number</p>
                      <p className="font-medium flex items-center gap-1">
                        <Hash className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{lotNumber}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Mfg Date</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{format(new Date(batch.manufacturing_date), 'MMM dd, yyyy')}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Total Mfg</p>
                      <p className="font-medium text-base md:text-lg">{batch.total_quantity_manufactured}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Labels Printed</p>
                      <p className="font-medium text-base md:text-lg">{batch.quantity_labeled}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Remaining</span>
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
                    <div className="text-xs text-muted-foreground border-l-2 border-border pl-3 py-1">
                      {batch.production_notes}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => onPrintLabels(batch)}
                  disabled={batch.quantity_remaining === 0}
                  className="w-full md:w-auto md:ml-4"
                  size="default"
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
