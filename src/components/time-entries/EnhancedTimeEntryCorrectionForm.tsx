import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEnhancedRequests } from '@/hooks/useEnhancedRequests';
import { TimeEntryRow } from '@/hooks/useTimeEntriesAdmin';

interface EnhancedTimeEntryCorrectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEntries: TimeEntryRow[];
  selectedEmptyDays?: string[]; // Array of date strings in 'yyyy-MM-dd' format
  onSubmit?: () => void;
}

export const EnhancedTimeEntryCorrectionForm: React.FC<EnhancedTimeEntryCorrectionFormProps> = ({
  open,
  onOpenChange,
  selectedEntries,
  selectedEmptyDays = [],
  onSubmit
}) => {
  const { createRequestWithAutoAssignment, requestTypes } = useEnhancedRequests();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState({
    original_clock_in: '',
    original_clock_out: '',
    corrected_clock_in: '',
    corrected_clock_out: '',
    reason: '',
    additional_notes: ''
  });

  // Find the time entry correction request type
  const correctionRequestType = requestTypes.find(
    type => type.name === 'Time Entry Correction'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionRequestType || !selectedDate) return;

    setLoading(true);
    try {
      const selectedEntry = selectedEntries[0]; // Use first selected entry for reference
      const hasEmptyDays = selectedEmptyDays.length > 0;
      const hasEntries = selectedEntries.length > 0;
      
      // Determine title based on what's selected
      let title = `Time Entry Correction for ${format(selectedDate, 'MMM d, yyyy')}`;
      if (hasEmptyDays && !hasEntries) {
        title = `Missing Time Entry Request for ${format(selectedDate, 'MMM d, yyyy')}`;
      } else if (hasEmptyDays && hasEntries) {
        title = `Time Entry Correction & Missing Days for ${format(selectedDate, 'MMM d, yyyy')}`;
      }
      
      await createRequestWithAutoAssignment({
        request_type_id: correctionRequestType.id,
        title,
        description: `Correction request for time entry on ${format(selectedDate, 'PPPP')}`,
        form_data: {
          original_date: format(selectedDate, 'yyyy-MM-dd'),
          ...formData,
          original_entry_id: selectedEntry?.id,
          affected_entries: selectedEntries.map(entry => ({
            id: entry.id,
            date: entry.clock_in,
            original_duration: entry.duration_minutes
          })),
          missing_days: selectedEmptyDays.map(dayStr => ({
            date: dayStr,
            reason: 'No time entry recorded'
          })),
          correction_type: hasEmptyDays && !hasEntries ? 'missing_entry' : hasEmptyDays ? 'mixed' : 'correction'
        },
        priority: 'medium'
      });

      // Reset form
      setFormData({
        original_clock_in: '',
        original_clock_out: '',
        corrected_clock_in: '',
        corrected_clock_out: '',
        reason: '',
        additional_notes: ''
      });
      setSelectedDate(undefined);
      
      onSubmit?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting correction request:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill form data if there's a selected entry or empty day
  React.useEffect(() => {
    if (open) {
      if (selectedEntries.length > 0) {
        const entry = selectedEntries[0];
        const entryDate = new Date(entry.clock_in);
        
        setSelectedDate(entryDate);
        setFormData(prev => ({
          ...prev,
          original_clock_in: format(entryDate, 'HH:mm'),
          original_clock_out: entry.clock_out ? format(new Date(entry.clock_out), 'HH:mm') : ''
        }));
      } else if (selectedEmptyDays.length > 0) {
        // Pre-fill with first selected empty day
        const emptyDate = new Date(selectedEmptyDays[0]);
        setSelectedDate(emptyDate);
        setFormData(prev => ({
          ...prev,
          original_clock_in: '',
          original_clock_out: '',
          reason: prev.reason || 'Missing time entry - forgot to clock in/out'
        }));
      }
    }
  }, [selectedEntries, selectedEmptyDays, open]);

  if (!correctionRequestType) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Time Entry Correction Not Available</DialogTitle>
          </DialogHeader>
          <p>Time entry correction requests are not configured for your organization. Please contact your administrator.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {selectedEmptyDays.length > 0 && selectedEntries.length === 0 
              ? 'Request Missing Time Entry' 
              : selectedEmptyDays.length > 0 && selectedEntries.length > 0
              ? 'Request Time Entry Correction & Missing Days'
              : 'Request Time Entry Correction'
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date">Date of Time Entry *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Original Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="original_clock_in">
                Original Clock In {selectedEmptyDays.length > 0 && selectedEntries.length === 0 ? '(if any)' : '*'}
              </Label>
              <Input
                id="original_clock_in"
                type="time"
                value={formData.original_clock_in}
                onChange={(e) => setFormData(prev => ({ ...prev, original_clock_in: e.target.value }))}
                required={selectedEntries.length > 0}
                placeholder={selectedEmptyDays.length > 0 && selectedEntries.length === 0 ? "No clock in recorded" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="original_clock_out">Original Clock Out</Label>
              <Input
                id="original_clock_out"
                type="time"
                value={formData.original_clock_out}
                onChange={(e) => setFormData(prev => ({ ...prev, original_clock_out: e.target.value }))}
                placeholder={selectedEmptyDays.length > 0 && selectedEntries.length === 0 ? "No clock out recorded" : ""}
              />
            </div>
          </div>

          {/* Corrected Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="corrected_clock_in">Corrected Clock In *</Label>
              <Input
                id="corrected_clock_in"
                type="time"
                value={formData.corrected_clock_in}
                onChange={(e) => setFormData(prev => ({ ...prev, corrected_clock_in: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="corrected_clock_out">Corrected Clock Out</Label>
              <Input
                id="corrected_clock_out"
                type="time"
                value={formData.corrected_clock_out}
                onChange={(e) => setFormData(prev => ({ ...prev, corrected_clock_out: e.target.value }))}
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Correction *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Please explain why this correction is needed..."
              required
              rows={3}
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="additional_notes">Additional Notes</Label>
            <Textarea
              id="additional_notes"
              value={formData.additional_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
              placeholder="Any additional context or information..."
              rows={2}
            />
          </div>

          {/* Info Box */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This request will be sent to your team manager and administrators for approval. 
              You will receive a notification once it has been reviewed.
              {selectedEmptyDays.length > 0 && (
                <>
                  <br /><br />
                  <strong>Missing Days:</strong> {selectedEmptyDays.length > 0 && (
                    <>You're requesting corrections for {selectedEmptyDays.length} day(s) with no recorded time entries.</>
                  )}
                </>
              )}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedDate || !formData.reason}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};