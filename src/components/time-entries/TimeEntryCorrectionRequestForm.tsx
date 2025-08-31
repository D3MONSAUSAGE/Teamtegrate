import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TimeEntryRow } from '@/hooks/useTimeEntriesAdmin';
import { CreateCorrectionRequest } from '@/hooks/useTimeEntryCorrectionRequests';

interface TimeEntryCorrectionRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEntries: TimeEntryRow[];
  onSubmit: (data: CreateCorrectionRequest) => Promise<void>;
}

const formatTime = (iso?: string | null) => {
  if (!iso) return '';
  try {
    return format(new Date(iso), 'HH:mm');
  } catch {
    return '';
  }
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '';
  try {
    return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
};

export const TimeEntryCorrectionRequestForm: React.FC<TimeEntryCorrectionRequestFormProps> = ({
  open,
  onOpenChange,
  selectedEntries,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [corrections, setCorrections] = useState<Record<string, {
    corrected_clock_in: string;
    corrected_clock_out: string;
    corrected_notes: string;
  }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize corrections when entries change
  React.useEffect(() => {
    const newCorrections: typeof corrections = {};
    selectedEntries.forEach(entry => {
      newCorrections[entry.id] = {
        corrected_clock_in: formatDateTime(entry.clock_in),
        corrected_clock_out: formatDateTime(entry.clock_out),
        corrected_notes: entry.notes || '',
      };
    });
    setCorrections(newCorrections);
  }, [selectedEntries]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for the correction request');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestData: CreateCorrectionRequest = {
        employee_reason: reason,
        corrections: selectedEntries.map(entry => ({
          time_entry_id: entry.id,
          original_clock_in: entry.clock_in,
          original_clock_out: entry.clock_out,
          original_notes: entry.notes,
          corrected_clock_in: corrections[entry.id]?.corrected_clock_in || null,
          corrected_clock_out: corrections[entry.id]?.corrected_clock_out || null,
          corrected_notes: corrections[entry.id]?.corrected_notes || null,
        })),
      };

      await onSubmit(requestData);
      setReason('');
      setCorrections({});
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit correction request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCorrection = (entryId: string, field: string, value: string) => {
    setCorrections(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [field]: value,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Time Entry Corrections</DialogTitle>
          <DialogDescription>
            Submit a request to correct {selectedEntries.length} time {selectedEntries.length === 1 ? 'entry' : 'entries'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="reason">Reason for Correction *</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why these time entries need to be corrected..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium">Time Entry Corrections</h3>
            {selectedEntries.map((entry) => (
              <div key={entry.id} className="p-4 border rounded-lg space-y-3">
                <div className="font-medium">
                  Entry: {format(new Date(entry.clock_in), 'PPP')}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Original</h4>
                    <div className="text-sm">
                      <div>Clock In: {formatTime(entry.clock_in)}</div>
                      <div>Clock Out: {formatTime(entry.clock_out)}</div>
                      <div>Notes: {entry.notes || 'None'}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Corrected</h4>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor={`clock_in_${entry.id}`} className="text-xs">Clock In</Label>
                        <Input
                          id={`clock_in_${entry.id}`}
                          type="datetime-local"
                          value={corrections[entry.id]?.corrected_clock_in || ''}
                          onChange={(e) => updateCorrection(entry.id, 'corrected_clock_in', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`clock_out_${entry.id}`} className="text-xs">Clock Out</Label>
                        <Input
                          id={`clock_out_${entry.id}`}
                          type="datetime-local"
                          value={corrections[entry.id]?.corrected_clock_out || ''}
                          onChange={(e) => updateCorrection(entry.id, 'corrected_clock_out', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`notes_${entry.id}`} className="text-xs">Notes</Label>
                        <Input
                          id={`notes_${entry.id}`}
                          value={corrections[entry.id]?.corrected_notes || ''}
                          onChange={(e) => updateCorrection(entry.id, 'corrected_notes', e.target.value)}
                          placeholder="Enter notes..."
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};