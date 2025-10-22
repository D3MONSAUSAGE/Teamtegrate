import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeOffRequests } from '@/hooks/useTimeOffRequests';
import { useTimeOffBalances } from '@/hooks/useTimeOffBalances';
import { format, differenceInBusinessDays } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TimeOffRequestDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TimeOffRequestDialog: React.FC<TimeOffRequestDialogProps> = ({
  userId,
  open,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const { createRequest } = useTimeOffRequests(userId);
  const { getAvailableHours } = useTimeOffBalances(userId);

  const [leaveType, setLeaveType] = useState('vacation');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [hoursRequested, setHoursRequested] = useState(8);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableHours = getAvailableHours(leaveType);

  const calculateBusinessDays = () => {
    if (!startDate || !endDate) return 0;
    return Math.max(0, differenceInBusinessDays(endDate, startDate) + 1);
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate || !user?.organizationId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (leaveType !== 'unpaid' && hoursRequested > availableHours) {
      toast.error(`Insufficient ${leaveType} balance. Available: ${availableHours} hours`);
      return;
    }

    setIsSubmitting(true);
    try {
      createRequest({
        organization_id: user.organizationId,
        user_id: userId,
        leave_type: leaveType,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        hours_requested: hoursRequested,
        status: 'pending',
        notes: notes || undefined,
      });

      onOpenChange(false);
      setLeaveType('vacation');
      setStartDate(undefined);
      setEndDate(undefined);
      setHoursRequested(8);
      setNotes('');
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Time Off</DialogTitle>
          <DialogDescription>
            Submit a time off request for manager approval
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leave_type">Leave Type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vacation">Vacation</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="personal">Personal Day</SelectItem>
                <SelectItem value="unpaid">Unpaid Leave</SelectItem>
              </SelectContent>
            </Select>
            {leaveType !== 'unpaid' && (
              <p className="text-xs text-muted-foreground">
                Available: {availableHours} hours ({Math.floor(availableHours / 8)} days)
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'MMM d, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours_requested">Hours Requested</Label>
            <Input
              id="hours_requested"
              type="number"
              min="1"
              step="1"
              value={hoursRequested}
              onChange={(e) => setHoursRequested(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              {calculateBusinessDays()} business days = {calculateBusinessDays() * 8} hours
              (suggested)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !startDate || !endDate}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeOffRequestDialog;
