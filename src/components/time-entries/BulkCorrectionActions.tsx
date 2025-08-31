import React, { useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CorrectionRequest } from '@/hooks/useTimeEntryCorrectionRequests';

interface BulkCorrectionActionsProps {
  selectedRequests: CorrectionRequest[];
  onApprove: (requestIds: string[], notes?: string) => Promise<void>;
  onReject: (requestIds: string[], notes?: string) => Promise<void>;
  onClearSelection: () => void;
}

export const BulkCorrectionActions: React.FC<BulkCorrectionActionsProps> = ({
  selectedRequests,
  onApprove,
  onReject,
  onClearSelection,
}) => {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [bulkNotes, setBulkNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedRequests.length === 0) {
    return null;
  }

  const handleBulkApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(selectedRequests.map(r => r.id), bulkNotes);
      setBulkNotes('');
      setShowApproveDialog(false);
      onClearSelection();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(selectedRequests.map(r => r.id), bulkNotes);
      setBulkNotes('');
      setShowRejectDialog(false);
      onClearSelection();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <Checkbox checked={true} onCheckedChange={onClearSelection} />
        <span className="text-sm font-medium">
          {selectedRequests.length} request{selectedRequests.length > 1 ? 's' : ''} selected
        </span>
        
        <div className="flex items-center gap-2 ml-auto">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowRejectDialog(true)}
          >
            <X className="h-4 w-4 mr-1" />
            Bulk Reject
          </Button>
          <Button
            size="sm"
            onClick={() => setShowApproveDialog(true)}
          >
            <Check className="h-4 w-4 mr-1" />
            Bulk Approve
          </Button>
        </div>
      </div>

      {/* Bulk Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Approve Requests</DialogTitle>
            <DialogDescription>
              You are about to approve {selectedRequests.length} correction requests.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-3 rounded text-sm">
              <strong>Requests to approve:</strong>
              <ul className="mt-2 space-y-1">
                {selectedRequests.map(request => (
                  <li key={request.id} className="truncate">
                    #{request.id.slice(0, 8)} - {request.employee_reason.slice(0, 50)}...
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label htmlFor="bulk_notes" className="block text-sm font-medium mb-1">
                Notes (Optional)
              </label>
              <Textarea
                id="bulk_notes"
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder="Add notes that will be applied to all selected requests..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkApprove} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : `Approve ${selectedRequests.length} Requests`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Reject Requests</DialogTitle>
            <DialogDescription>
              You are about to reject {selectedRequests.length} correction requests.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <strong>Warning:</strong> This action will reject all selected requests. 
                Make sure you've reviewed each one carefully.
              </div>
            </div>

            <div className="bg-muted p-3 rounded text-sm">
              <strong>Requests to reject:</strong>
              <ul className="mt-2 space-y-1">
                {selectedRequests.map(request => (
                  <li key={request.id} className="truncate">
                    #{request.id.slice(0, 8)} - {request.employee_reason.slice(0, 50)}...
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label htmlFor="bulk_reject_notes" className="block text-sm font-medium mb-1">
                Rejection Reason (Recommended)
              </label>
              <Textarea
                id="bulk_reject_notes"
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder="Explain why these requests are being rejected..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBulkReject} 
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : `Reject ${selectedRequests.length} Requests`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};