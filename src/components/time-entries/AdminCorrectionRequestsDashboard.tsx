import React, { useState } from 'react';
import { format } from 'date-fns';
import { Eye, Check, X, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CorrectionRequestStatusBadge } from './CorrectionRequestStatusBadge';
import { useTimeEntryCorrectionRequests, CorrectionRequest } from '@/hooks/useTimeEntryCorrectionRequests';

interface AdminReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: CorrectionRequest | null;
  corrections: any[];
  onApprove: (requestId: string, notes?: string) => Promise<void>;
  onReject: (requestId: string, notes?: string) => Promise<void>;
}

const AdminReviewDialog: React.FC<AdminReviewDialogProps> = ({
  open,
  onOpenChange,
  request,
  corrections,
  onApprove,
  onReject,
}) => {
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    if (!request) return;
    setIsProcessing(true);
    try {
      await onApprove(request.id, notes);
      setNotes('');
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    setIsProcessing(true);
    try {
      await onReject(request.id, notes);
      setNotes('');
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Final Admin Review
          </DialogTitle>
          <DialogDescription>
            Request #{request.id.slice(0, 8)} - Final approval required before applying changes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded">
            <div className="text-sm font-medium mb-1">Request Summary</div>
            <div className="text-sm space-y-1">
              <div>Submitted: {format(new Date(request.created_at), 'PPP')}</div>
              <div>Status: <CorrectionRequestStatusBadge status={request.status} /></div>
              {request.manager_reviewed_at && (
                <div>Manager Reviewed: {format(new Date(request.manager_reviewed_at), 'PPP')}</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Employee Reason</h3>
            <p className="text-sm bg-background p-3 rounded border">{request.employee_reason}</p>
          </div>

          {request.manager_notes && (
            <div>
              <h3 className="font-medium mb-2">Manager Notes</h3>
              <p className="text-sm bg-background p-3 rounded border">{request.manager_notes}</p>
            </div>
          )}

          <Separator />

          <div>
            <h3 className="font-medium mb-2">Time Entry Changes to Apply</h3>
            <div className="space-y-3">
              {corrections.map((correction) => (
                <div key={correction.id} className="p-3 border rounded">
                  <div className="text-xs text-muted-foreground mb-2">
                    Entry ID: {correction.time_entry_id.slice(0, 8)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Current Values</h4>
                      <div className="text-sm space-y-1">
                        <div>Clock In: {correction.original_clock_in ? format(new Date(correction.original_clock_in), 'PPp') : 'N/A'}</div>
                        <div>Clock Out: {correction.original_clock_out ? format(new Date(correction.original_clock_out), 'PPp') : 'N/A'}</div>
                        <div>Notes: {correction.original_notes || 'None'}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Will Change To</h4>
                      <div className="text-sm space-y-1 text-blue-600 dark:text-blue-400">
                        <div>Clock In: {correction.corrected_clock_in ? format(new Date(correction.corrected_clock_in), 'PPp') : 'No change'}</div>
                        <div>Clock Out: {correction.corrected_clock_out ? format(new Date(correction.corrected_clock_out), 'PPp') : 'No change'}</div>
                        <div>Notes: {correction.corrected_notes || 'No change'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <label htmlFor="admin_notes" className="block text-sm font-medium mb-1">
              Admin Notes (Optional)
            </label>
            <Textarea
              id="admin_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any final comments about this approval/rejection..."
              rows={3}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-sm">
            <strong>⚠️ Warning:</strong> Approving this request will immediately modify the time entries in the database. 
            This action cannot be undone. Please ensure the changes are accurate and justified.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={isProcessing}
          >
            <X className="h-4 w-4 mr-1" />
            Reject Request
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-1" />
            Approve & Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const AdminCorrectionRequestsDashboard: React.FC = () => {
  const { pendingAdminRequests, corrections, updateRequestStatus } = useTimeEntryCorrectionRequests();
  const [selectedRequest, setSelectedRequest] = useState<CorrectionRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const handleReview = (request: CorrectionRequest) => {
    setSelectedRequest(request);
    setReviewDialogOpen(true);
  };

  const handleApprove = async (requestId: string, notes?: string) => {
    await updateRequestStatus(requestId, 'approved', notes);
  };

  const handleReject = async (requestId: string, notes?: string) => {
    await updateRequestStatus(requestId, 'rejected', notes);
  };

  if (pendingAdminRequests.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground">No correction requests requiring admin approval.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Admin Review Required</h2>
      </div>
      
      {pendingAdminRequests.map((request) => (
        <Card key={request.id} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                Request #{request.id.slice(0, 8)}
              </span>
              <CorrectionRequestStatusBadge status={request.status} />
            </div>
            <span className="text-sm text-muted-foreground">
              {format(new Date(request.created_at), 'PPP')}
            </span>
          </div>

          <div className="space-y-2 mb-3">
            <div>
              <span className="text-sm font-medium">Reason: </span>
              <span className="text-sm">{request.employee_reason}</span>
            </div>

            {request.manager_notes && (
              <div>
                <span className="text-sm font-medium">Manager Notes: </span>
                <span className="text-sm">{request.manager_notes}</span>
              </div>
            )}

            {corrections[request.id] && (
              <div>
                <span className="text-sm font-medium">
                  Time Entries to Modify: {corrections[request.id].length}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReview(request)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Review & Decide
            </Button>
          </div>
        </Card>
      ))}

      <AdminReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        request={selectedRequest}
        corrections={selectedRequest ? corrections[selectedRequest.id] || [] : []}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};