import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, MapPin, Users, Plus } from 'lucide-react';
import { UserSelector } from '@/components/ui/user-selector';
import { useMeetingRequests } from '@/hooks/useMeetingRequests';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { toDateTimeLocalString, validateTimeRange, validateFutureDate, addMinutesToDateTime } from '@/utils/dateUtils';
import { toast } from 'sonner';

interface MeetingRequestDialogProps {
  trigger?: React.ReactNode;
  defaultDate?: Date;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const MeetingRequestDialog: React.FC<MeetingRequestDialogProps> = ({ 
  trigger,
  defaultDate = new Date(),
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize form when dialog opens or defaultDate changes
  React.useEffect(() => {
    if (open) {
      const initialStart = toDateTimeLocalString(defaultDate);
      const initialEnd = addMinutesToDateTime(initialStart, 60);
      setStartDate(initialStart);
      setEndDate(initialEnd);
    }
  }, [open, defaultDate]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setLocation('');
      setSelectedParticipants([]);
    }
  }, [open]);

  const { createMeetingRequest } = useMeetingRequests();
  const { users } = useOrganizationUsers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }
    
    if (selectedParticipants.length === 0) {
      toast.error('Please select at least one participant');
      return;
    }

    if (!validateFutureDate(startDate)) {
      toast.error('Meeting start time must be in the future');
      return;
    }

    if (!validateTimeRange(startDate, endDate)) {
      toast.error('Meeting end time must be after start time');
      return;
    }

    setLoading(true);
    try {
      const result = await createMeetingRequest(
        title,
        description,
        new Date(startDate),
        new Date(endDate),
        selectedParticipants,
        location || undefined
      );

      if (result) {
        setOpen(false);
        toast.success('Meeting invitation sent successfully');
      }
    } catch (error) {
      toast.error('Failed to send meeting invitation');
    } finally {
      setLoading(false);
    }
  };

  // Handle start date change and auto-adjust end date if needed
  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    
    // If end date is before new start date, adjust it
    if (value && endDate && new Date(value) >= new Date(endDate)) {
      const newEndDate = addMinutesToDateTime(value, 60);
      setEndDate(newEndDate);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      {!trigger && trigger !== null && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Schedule Meeting
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Meeting
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Team standup"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Discuss project progress and blockers"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start Time
              </Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                min={toDateTimeLocalString(new Date())}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || toDateTimeLocalString(new Date())}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location (Optional)
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Conference Room A or Zoom link"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants
            </Label>
            <UserSelector
              users={users}
              selectedUserIds={selectedParticipants}
              onSelectionChange={setSelectedParticipants}
              placeholder="Select team members to invite"
              multiple
              maxSelection={50}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !title.trim() || selectedParticipants.length === 0 || !startDate || !endDate}
              className="flex-1"
            >
              {loading ? 'Sending...' : 'Send Invitations'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};