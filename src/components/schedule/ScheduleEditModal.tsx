import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduleEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: any;
  onSuccess?: () => void;
}

const SCHEDULE_AREAS = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'dining', label: 'Dining Area' },
  { value: 'bar', label: 'Bar' },
  { value: 'front_desk', label: 'Front Desk' },
  { value: 'back_office', label: 'Back Office' },
  { value: 'storage', label: 'Storage' },
  { value: 'drive_thru', label: 'Drive-Thru' },
  { value: 'prep', label: 'Prep Area' },
  { value: 'other', label: 'Other' },
] as const;

export const ScheduleEditModal: React.FC<ScheduleEditModalProps> = ({
  open,
  onOpenChange,
  schedule,
  onSuccess
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [startTime, setStartTime] = useState(
    schedule ? format(new Date(schedule.scheduled_start_time), 'HH:mm') : ''
  );
  const [endTime, setEndTime] = useState(
    schedule ? format(new Date(schedule.scheduled_end_time), 'HH:mm') : ''
  );
  const [notes, setNotes] = useState(schedule?.notes || '');
  const [area, setArea] = useState(schedule?.area || '');

  const handleUpdate = async () => {
    if (!schedule) return;

    // Validate times
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }

    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (hours > 16) {
      toast.error('Shift cannot be longer than 16 hours');
      return;
    }

    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('employee_schedules')
        .update({
          scheduled_start_time: `${schedule.scheduled_date}T${startTime}:00`,
          scheduled_end_time: `${schedule.scheduled_date}T${endTime}:00`,
          notes: notes || null,
          area: area || null,
        })
        .eq('id', schedule.id);

      if (error) throw error;

      toast.success('Schedule updated successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule) return;
    
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('employee_schedules')
        .delete()
        .eq('id', schedule.id);

      if (error) throw error;

      toast.success('Schedule deleted successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!schedule) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Edit Schedule
          </DialogTitle>
          <DialogDescription>
            Modify the schedule for {schedule.users?.name || 'Employee'} on {format(new Date(schedule.scheduled_date), 'MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Area</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger id="area">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULE_AREAS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this shift..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isUpdating}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating || isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || isDeleting}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};