import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface InventoryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId?: string | null;
}

export const InventoryItemDialog: React.FC<InventoryItemDialogProps> = ({
  open,
  onOpenChange,
  itemId
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {itemId ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-muted-foreground">Item management form coming soon...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};