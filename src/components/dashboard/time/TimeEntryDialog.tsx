
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, parse, isValid, set } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onSuccess?: () => void;
}

const TimeEntryDialog: React.FC<TimeEntryDialogProps> = ({ 
  open, 
  onOpenChange,
  selectedDate = new Date(),
  onSuccess
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [notes, setNotes] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      setStartTime(format(now, 'HH:mm'));
      setEndTime(format(now, 'HH:mm'));
      setNotes('');
    }
  }, [open]);

  // Format time string (HH:MM) to a full date with the selected date
  const formatTimeToDate = (time: string, date: Date) => {
    const [hours, minutes] = time.split(':').map(Number);
    return set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const startDate = formatTimeToDate(startTime, selectedDate);
    const endDate = formatTimeToDate(endTime, selectedDate);

    // Validate times
    if (!isValid(startDate) || !isValid(endDate)) {
      toast.error('Invalid time format');
      return;
    }

    if (endDate < startDate) {
      toast.error('End time must be after start time');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert([
          {
            user_id: user.id,
            clock_in: startDate.toISOString(),
            clock_out: endDate.toISOString(),
            notes: notes.trim() || null,
          },
        ])
        .select();

      if (error) {
        console.error('Error creating time entry:', error);
        toast.error('Failed to create time entry');
      } else {
        toast.success('Time entry added successfully');
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Unexpected error in handleSubmit:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Time Entry</DialogTitle>
          <DialogDescription>
            Record your working hours for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this time entry..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TimeEntryDialog;
