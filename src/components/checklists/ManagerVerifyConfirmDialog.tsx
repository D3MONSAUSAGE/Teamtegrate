import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';

interface ManagerVerifyConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  checklistName: string;
  completedItems: number;
  totalItems: number;
  isLoading: boolean;
}

export const ManagerVerifyConfirmDialog: React.FC<ManagerVerifyConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  checklistName,
  completedItems,
  totalItems,
  isLoading,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md animate-scale-in">
        <DialogHeader className="space-y-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            Complete & Verify Checklist
          </DialogTitle>
          <DialogDescription className="space-y-4 text-left">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="font-medium text-amber-800">Final Action</span>
              </div>
              <p className="text-amber-700 text-sm leading-relaxed">
                This will permanently complete and verify the checklist <strong>"{checklistName}"</strong>. 
                Once verified, no further changes can be made.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Completion Status:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {completedItems}/{totalItems} items completed
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Verification Status:</span>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  All items verified by manager
                </Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to proceed with the final verification?
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete & Verify
                <Sparkles className="h-4 w-4 ml-2 opacity-60" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};