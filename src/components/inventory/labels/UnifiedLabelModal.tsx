import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CleanLabelSystem } from './CleanLabelSystem';
import { Package } from 'lucide-react';

interface UnifiedLabelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedItemId?: string;
}

export const UnifiedLabelModal: React.FC<UnifiedLabelModalProps> = ({
  open,
  onOpenChange,
  preSelectedItemId
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Label Generator
          </DialogTitle>
        </DialogHeader>
        
        <CleanLabelSystem />
      </DialogContent>
    </Dialog>
  );
};