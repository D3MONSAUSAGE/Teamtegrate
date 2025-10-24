import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  selectedTeamId?: string | null;
}

export const UnifiedLabelModal: React.FC<UnifiedLabelModalProps> = ({
  open,
  onOpenChange,
  preSelectedItemId,
  batchData,
  selectedTeamId
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
          <DialogDescription>
            {batchData ? (
              `Print labels for ${batchData.itemName || 'batch'} • ${batchData.maxQuantity} units remaining`
            ) : (
              'Generate professional labels with barcodes, nutrition facts, and company branding'
            )}
          </DialogDescription>
        </DialogHeader>
        
        <ProfessionalLabelGenerator 
          preSelectedItemId={preSelectedItemId || batchData?.itemId}
          batchData={batchData}
          inModal={true}
          selectedTeamId={selectedTeamId}
        />
      </DialogContent>
    </Dialog>
  );
};