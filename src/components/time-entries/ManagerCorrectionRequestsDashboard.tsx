import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Eye, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CorrectionRequestStatusBadge } from './CorrectionRequestStatusBadge';
import { CorrectionRequestFilters } from './CorrectionRequestFilters';
import { BulkCorrectionActions } from './BulkCorrectionActions';
import { useTimeEntryCorrectionRequests, CorrectionRequest } from '@/hooks/useTimeEntryCorrectionRequests';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: CorrectionRequest | null;
  corrections: any[];
  onApprove: (requestId: string, notes?: string) => Promise<void>;
  onReject: (requestId: string, notes?: string) => Promise<void>;
}

const ReviewDialog: React.FC<ReviewDialogProps> = ({
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
          <DialogTitle>Review Correction Request</DialogTitle>
          <DialogDescription>
            Request #{request.id.slice(0, 8)} from {format(new Date(request.created_at), 'PPP')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Employee Reason</h3>
            <p className="text-sm bg-muted p-3 rounded">{request.employee_reason}</p>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-2">Requested Corrections</h3>
            <div className="space-y-3">
              {corrections.map((correction) => (
                <div key={correction.id} className="p-3 border rounded">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Original</h4>
                      <div className="text-sm space-y-1">
                        <div>Clock In: {correction.original_clock_in ? format(new Date(correction.original_clock_in), 'PPp') : 'N/A'}</div>
                        <div>Clock Out: {correction.original_clock_out ? format(new Date(correction.original_clock_out), 'PPp') : 'N/A'}</div>
                        <div>Notes: {correction.original_notes || 'None'}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Corrected</h4>
                      <div className="text-sm space-y-1">
                        <div>Clock In: {correction.corrected_clock_in ? format(new Date(correction.corrected_clock_in), 'PPp') : 'N/A'}</div>
                        <div>Clock Out: {correction.corrected_clock_out ? format(new Date(correction.corrected_clock_out), 'PPp') : 'N/A'}</div>
                        <div>Notes: {correction.corrected_notes || 'None'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <label htmlFor="manager_notes" className="block text-sm font-medium mb-1">
              Manager Notes (Optional)
            </label>
            <Textarea
              id="manager_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any comments about this request..."
              rows={3}
            />
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
            Reject
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={isProcessing}
          >
            <Check className="h-4 w-4 mr-1" />
            Approve & Forward to Admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ManagerCorrectionRequestsDashboard: React.FC = () => {
  const { pendingManagerRequests, corrections, updateRequestStatus, updateMultipleRequestsStatus } = useTimeEntryCorrectionRequests();
  const [selectedRequest, setSelectedRequest] = useState<CorrectionRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRequests = useMemo(() => {
    let filtered = pendingManagerRequests;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(request =>
        request.employee_reason.toLowerCase().includes(query) ||
        request.manager_notes?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [pendingManagerRequests, searchQuery]);

  const selectedRequests = filteredRequests.filter(r => selectedRequestIds.has(r.id));

  const handleReview = (request: CorrectionRequest) => {
    setSelectedRequest(request);
    setReviewDialogOpen(true);
  };

  const handleApprove = async (requestId: string, notes?: string) => {
    await updateRequestStatus(requestId, 'manager_approved', notes);
  };

  const handleReject = async (requestId: string, notes?: string) => {
    await updateRequestStatus(requestId, 'rejected', notes);
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    setSelectedRequestIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(requestId);
      } else {
        newSet.delete(requestId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequestIds(new Set(filteredRequests.map(r => r.id)));
    } else {
      setSelectedRequestIds(new Set());
    }
  };

  const handleBulkApprove = async (requestIds: string[], notes?: string) => {
    await updateMultipleRequestsStatus(requestIds, 'manager_approved', notes);
    setSelectedRequestIds(new Set());
  };

  const handleBulkReject = async (requestIds: string[], notes?: string) => {
    await updateMultipleRequestsStatus(requestIds, 'rejected', notes);
    setSelectedRequestIds(new Set());
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
  };

  if (pendingManagerRequests.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No correction requests requiring your review.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Manager Review Queue</h2>
        <div className="flex items-center gap-2">
          {filteredRequests.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedRequestIds.size === filteredRequests.length && filteredRequests.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            {filteredRequests.length} of {pendingManagerRequests.length} requests
          </div>
        </div>
      </div>

      <CorrectionRequestFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onClearFilters={handleClearFilters}
      />

      <BulkCorrectionActions
        selectedRequests={selectedRequests}
        onApprove={handleBulkApprove}
        onReject={handleBulkReject}
        onClearSelection={() => setSelectedRequestIds(new Set())}
      />

      {filteredRequests.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            {pendingManagerRequests.length === 0 
              ? "No correction requests requiring your review."
              : "No requests match your current filters."
            }
          </p>
        </Card>
      ) : (
        filteredRequests.map((request) => (
        <Card key={request.id} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedRequestIds.has(request.id)}
                onCheckedChange={(checked) => handleSelectRequest(request.id, !!checked)}
              />
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  Request #{request.id.slice(0, 8)}
                </span>
                <CorrectionRequestStatusBadge status={request.status} />
              </div>
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

            {corrections[request.id] && (
              <div>
                <span className="text-sm font-medium">
                  Time Entries: {corrections[request.id].length}
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
              Review Details
            </Button>
          </div>
        </Card>
        ))
      )}

      <ReviewDialog
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