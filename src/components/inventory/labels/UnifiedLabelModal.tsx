import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ProfessionalLabelGenerator } from './ProfessionalLabelGenerator';
import { Package, Factory } from 'lucide-react';

interface BatchData {
  batchId: string;
  batchNumber: string;
  itemId?: string;
  lotId?: string;
  lotNumber?: string;
  itemName?: string;
  maxQuantity?: number;
}

interface UnifiedLabelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedItemId?: string;
  batchData?: BatchData;
}

export const UnifiedLabelModal: React.FC<UnifiedLabelModalProps> = ({
  open,
  onOpenChange,
  preSelectedItemId,
  batchData
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {batchData ? (
              <>
                <Factory className="h-5 w-5 text-primary" />
                <span>Print Batch Labels</span>
                <Badge variant="secondary" className="ml-2">
                  Batch #{batchData.batchNumber}
                </Badge>
              </>
            ) : (
              <>
                <Package className="h-5 w-5" />
                <span>Label Generator</span>
              </>
            )}
          </DialogTitle>
          {batchData?.itemName && (
            <p className="text-sm text-muted-foreground">
              {batchData.itemName} • {batchData.maxQuantity} units remaining
            </p>
          )}
        </DialogHeader>
        
        <ProfessionalLabelGenerator 
          preSelectedItemId={preSelectedItemId || batchData?.itemId}
          batchData={batchData}
        />
      </DialogContent>
    </Dialog>
  );
};