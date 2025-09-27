import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Package } from 'lucide-react';
import { InventoryCount, InventoryCountItem } from '@/contexts/inventory/types';
import { useCountApproval } from '@/hooks/useCountApproval';

interface CountApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  count: InventoryCount;
  countItems: InventoryCountItem[];
  onApprovalComplete: () => void;
}

export const CountApprovalDialog: React.FC<CountApprovalDialogProps> = ({
  isOpen,
  onClose,
  count,
  countItems,
  onApprovalComplete,
}) => {
  const [notes, setNotes] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<boolean | null>(null);
  const { approveCount, isApproving } = useCountApproval();

  const handleApproval = async (approved: boolean) => {
    if (approved) {
      // Show warning dialog for approval
      setPendingApproval(true);
      setShowWarning(true);
    } else {
      // Direct rejection
      const success = await approveCount({
        countId: count.id,
        approved: false,
        notes,
      });
      
      if (success) {
        onApprovalComplete();
        onClose();
      }
    }
  };

  const confirmApproval = async () => {
    if (pendingApproval === null) return;
    
    const success = await approveCount({
      countId: count.id,
      approved: pendingApproval,
      notes,
    });
    
    if (success) {
      onApprovalComplete();
      onClose();
    }
    
    setShowWarning(false);
    setPendingApproval(null);
  };

  const calculateVariances = () => {
    const variances = countItems.filter(item => {
      const actual = item.actual_quantity || 0;
      const expected = item.in_stock_quantity || 0;
      return Math.abs(actual - expected) > 0.01;
    });
    
    const positiveVariances = variances.filter(item => 
      (item.actual_quantity || 0) > (item.in_stock_quantity || 0)
    );
    
    const negativeVariances = variances.filter(item => 
      (item.actual_quantity || 0) < (item.in_stock_quantity || 0)
    );

    return { variances, positiveVariances, negativeVariances };
  };

  const { variances, positiveVariances, negativeVariances } = calculateVariances();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Count Approval Required
            </DialogTitle>
            <DialogDescription>
              Review the inventory count details and approve or reject the count.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Count Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Count Date</Label>
                <p className="text-sm">{new Date(count.count_date).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Conducted By</Label>
                <p className="text-sm">{count.conducted_by}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Total Items</Label>
                <p className="text-sm">{count.total_items_count || 0}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Completion</Label>
                <p className="text-sm">{Math.round(count.completion_percentage || 0)}%</p>
              </div>
            </div>

            {/* Variance Summary */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Variance Summary</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Total Variances</span>
                  </div>
                  <p className="text-2xl font-bold">{variances.length}</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Overages</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{positiveVariances.length}</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Shortages</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{negativeVariances.length}</p>
                </div>
              </div>
            </div>

            {/* Top Variances */}
            {variances.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Significant Variances</Label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {variances.slice(0, 10).map((item) => {
                    const variance = (item.actual_quantity || 0) - (item.in_stock_quantity || 0);
                    const isPositive = variance > 0;
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between p-2 text-sm border rounded">
                        <span className="font-medium">{item.item?.name || 'Unknown Item'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {item.in_stock_quantity || 0} → {item.actual_quantity || 0}
                          </span>
                          <Badge variant={isPositive ? 'default' : 'destructive'}>
                            {isPositive ? '+' : ''}{variance.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Approval Notes */}
            <div className="space-y-2">
              <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add any notes about this approval decision..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleApproval(false)}
                disabled={isApproving}
              >
                Reject Count
              </Button>
              <Button
                onClick={() => handleApproval(true)}
                disabled={isApproving}
              >
                Approve Count
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Warehouse Update
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>Warning:</strong> Approving this count will automatically update 
                warehouse stock quantities based on the counted amounts.
              </p>
              <p>
                This action will:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Update warehouse stock for {countItems.length} items</li>
                <li>Create adjustment records for {variances.length} items with variances</li>
                <li>Generate an audit trail of all changes</li>
                <li>Cannot be easily undone</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Are you sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowWarning(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApproval}
              disabled={isApproving}
              className="bg-primary hover:bg-primary/90"
            >
              {isApproving ? 'Updating...' : 'Confirm & Update Warehouse'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};