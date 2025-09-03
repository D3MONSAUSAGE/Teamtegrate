import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit3, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TimeEntryCorrectionRequestForm } from '@/components/time-entries/TimeEntryCorrectionRequestForm';
import { useTimeEntryCorrectionRequests, type CreateCorrectionRequest } from '@/hooks/useTimeEntryCorrectionRequests';
import { TimeEntryRow } from '@/hooks/useTimeEntriesAdmin';

interface TimeEntryActionButtonsProps {
  entry: {
    id?: string;
    user_id?: string;
    clock_in: string;
    clock_out?: string | null;
    duration_minutes?: number | null;
    notes?: string | null;
  };
}

const TimeEntryActionButtons: React.FC<TimeEntryActionButtonsProps> = ({ entry }) => {
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const { createCorrectionRequest, requests, corrections } = useTimeEntryCorrectionRequests();

  // Only show for completed entries with required fields
  if (!entry.clock_out || !entry.id || !entry.user_id) {
    return null;
  }

  // Check if this entry already has a correction request
  const existingRequest = requests.find(req => {
    const requestCorrections = corrections[req.id] || [];
    return requestCorrections.some(correction => 
      correction.original_clock_in === entry.clock_in
    );
  });

  const getStatusIcon = () => {
    if (!existingRequest) return <Edit3 className="h-3 w-3" />;
    
    switch (existingRequest.status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-amber-500" />;
      case 'manager_approved':
        return <AlertCircle className="h-3 w-3 text-blue-500" />;
      case 'approved':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'rejected':
        return <Edit3 className="h-3 w-3 text-red-500" />;
      default:
        return <Edit3 className="h-3 w-3" />;
    }
  };

  const getButtonText = () => {
    if (!existingRequest) return "Request Correction";
    
    switch (existingRequest.status) {
      case 'pending':
        return "Pending Manager";
      case 'manager_approved':
        return "Pending HR";
      case 'approved':
        return "Approved";
      case 'rejected':
        return "Re-request";
      default:
        return "Request Correction";
    }
  };

  const getTooltipText = () => {
    if (!existingRequest) return "Request correction for this time entry";
    
    switch (existingRequest.status) {
      case 'pending':
        return "Correction request pending manager approval";
      case 'manager_approved':
        return "Manager approved, pending HR review";
      case 'approved':
        return "Correction has been approved and applied";
      case 'rejected':
        return "Correction was rejected, click to re-submit";
      default:
        return "Request correction for this time entry";
    }
  };

  const canRequest = !existingRequest || existingRequest.status === 'rejected';
  const isApproved = existingRequest?.status === 'approved';

  const handleCorrectionSubmit = async (correctionData: CreateCorrectionRequest) => {
    await createCorrectionRequest(correctionData);
    setShowCorrectionForm(false);
  };

  // Convert entry to TimeEntryRow format expected by the form
  const timeEntryRow: TimeEntryRow = {
    id: entry.id,
    user_id: entry.user_id,
    clock_in: entry.clock_in,
    clock_out: entry.clock_out,
    duration_minutes: entry.duration_minutes,
    notes: entry.notes
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => canRequest && setShowCorrectionForm(true)}
            disabled={!canRequest && !isApproved}
          >
            {getStatusIcon()}
            <span className="ml-1 hidden sm:inline">
              {getButtonText()}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>

      <TimeEntryCorrectionRequestForm
        open={showCorrectionForm}
        onOpenChange={setShowCorrectionForm}
        selectedEntries={[timeEntryRow]}
        onSubmit={handleCorrectionSubmit}
      />
    </>
  );
};

export default TimeEntryActionButtons;