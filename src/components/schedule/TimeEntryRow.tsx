import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Calendar, 
  StickyNote, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { TimeEntry } from '@/contexts/TimeTrackingContext';
import { CorrectionRequest } from '@/hooks/useTimeEntryCorrectionRequests';
import { format, differenceInMinutes } from 'date-fns';

interface TimeEntryRowProps {
  entry: TimeEntry;
  isSelected: boolean;
  onSelectionChange: (selected: boolean) => void;
  approvalStatusBadge: React.ReactNode;
  existingRequests: CorrectionRequest[];
}

const TimeEntryRow: React.FC<TimeEntryRowProps> = ({
  entry,
  isSelected,
  onSelectionChange,
  approvalStatusBadge,
  existingRequests,
}) => {
  const formatTime = (isoString: string) => {
    return format(new Date(isoString), 'HH:mm');
  };

  const calculateDuration = () => {
    if (!entry.clock_out) return 0;
    return differenceInMinutes(new Date(entry.clock_out), new Date(entry.clock_in));
  };

  const duration = entry.duration_minutes || calculateDuration();
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  // Check if this entry has a pending correction request
  const hasPendingCorrection = existingRequests.some(request => 
    request.status === 'pending' || request.status === 'manager_approved'
  );

  return (
    <div className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-sm hover:scale-[1.01] ${
      isSelected ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30'
    } ${hasPendingCorrection ? 'border-l-4 border-l-warning bg-gradient-to-r from-warning/5 to-transparent' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="flex items-center pt-1">
          <Checkbox
            id={`entry-${entry.id}`}
            checked={isSelected}
            onCheckedChange={onSelectionChange}
            disabled={hasPendingCorrection}
          />
        </div>

        <div className="flex-1 space-y-3">
          {/* Date and Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {format(new Date(entry.clock_in), 'EEE, MMM d')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {formatTime(entry.clock_in)} - {entry.clock_out ? formatTime(entry.clock_out) : 'Active'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {approvalStatusBadge}
              {hasPendingCorrection && (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Correction Pending
                </Badge>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium px-2 py-1 bg-muted/50 rounded-lg">
              Duration: {hours > 0 && `${hours}h `}{minutes}m
            </div>
            {duration > 480 && ( // More than 8 hours
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Overtime
              </Badge>
            )}
          </div>

          {/* Notes */}
          {entry.notes && (
            <div className="flex items-start gap-2">
              <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span className="text-sm text-muted-foreground">
                {entry.notes}
              </span>
            </div>
          )}

          {/* Approval Details */}
          {entry.approval_status === 'approved' && entry.approved_at && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              Approved on {format(new Date(entry.approved_at), 'MMM d, yyyy HH:mm')}
              {entry.approval_notes && (
                <span className="ml-2 italic">"{entry.approval_notes}"</span>
              )}
            </div>
          )}

          {entry.approval_status === 'rejected' && entry.approval_rejected_reason && (
            <div className="text-xs text-red-600 flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 mt-0.5" />
              <span>Rejected: {entry.approval_rejected_reason}</span>
            </div>
          )}
        </div>
      </div>

      {hasPendingCorrection && (
        <div className="absolute inset-0 bg-gradient-to-r from-warning/5 to-transparent opacity-50 rounded-xl pointer-events-none" />
      )}
    </div>
  );
};

export default TimeEntryRow;