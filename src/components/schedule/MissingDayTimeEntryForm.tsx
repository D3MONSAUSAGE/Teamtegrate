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
import { CalendarDays, Clock } from 'lucide-react';
import { CreateCorrectionRequest } from '@/hooks/useTimeEntryCorrectionRequests';

interface MissingDayTimeEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onSubmit: (data: CreateCorrectionRequest) => Promise<void>;
}

export const MissingDayTimeEntryForm: React.FC<MissingDayTimeEntryFormProps> = ({
  open,
  onOpenChange,
  selectedDate,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [proposedClockIn, setProposedClockIn] = useState('');
  const [proposedClockOut, setProposedClockOut] = useState('');
  const [proposedNotes, setProposedNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for the missing day correction request');
      return;
    }

    if (!proposedClockIn || !proposedClockOut) {
      alert('Please provide both clock in and clock out times');
      return;
    }

    setIsSubmitting(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const requestData: CreateCorrectionRequest = {
        employee_reason: reason,
        corrections: [{
          time_entry_id: null, // No existing time entry for missing days
          original_clock_in: null,
          original_clock_out: null,
          original_notes: null,
          corrected_clock_in: `${dateStr}T${proposedClockIn}:00`,
          corrected_clock_out: `${dateStr}T${proposedClockOut}:00`,
          corrected_notes: proposedNotes || null,
        }],
      };

      await onSubmit(requestData);
      
      // Reset form
      setReason('');
      setProposedClockIn('');
      setProposedClockOut('');
      setProposedNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit missing day correction request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Request Missing Day Time Entry
          </DialogTitle>
          <DialogDescription>
            Submit a request to add a time entry for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Missing Date</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Missing Time Entry *</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you didn't clock in/out on this day (e.g., forgot to clock in, system issue, etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clock_in" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Proposed Clock In Time *
              </Label>
              <Input
                id="clock_in"
                type="time"
                value={proposedClockIn}
                onChange={(e) => setProposedClockIn(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="clock_out" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Proposed Clock Out Time *
              </Label>
              <Input
                id="clock_out"
                type="time"
                value={proposedClockOut}
                onChange={(e) => setProposedClockOut(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Input
              id="notes"
              value={proposedNotes}
              onChange={(e) => setProposedNotes(e.target.value)}
              placeholder="Any additional details about your work on this day..."
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !reason.trim() || !proposedClockIn || !proposedClockOut}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};