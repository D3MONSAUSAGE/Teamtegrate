import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useMeetingRequests } from '@/hooks/useMeetingRequests';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { UserSelector } from '@/components/ui/user-selector';
import MeetingDateTimeSection from './MeetingDateTimeSection';

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
  const [startDateObj, setStartDateObj] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('09:00');
  const [endDateObj, setEndDateObj] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('10:00');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize form when dialog opens
  React.useEffect(() => {
    if (open) {
      setStartDateObj(defaultDate);
      setEndDateObj(defaultDate);
      setStartTime('09:00');
      setEndTime('10:00');
      // Reset other fields
      setTitle('');
      setDescription('');
      setLocation('');
      setSelectedParticipants([]);
    }
  }, [open, defaultDate]);

  const { createMeetingRequest } = useMeetingRequests();
  const { users } = useOrganizationUsers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }

    if (selectedParticipants.length === 0) {
      toast.error('Please select at least one participant');
      return;
    }

    if (!startDateObj || !endDateObj) {
      toast.error('Please select meeting dates');
      return;
    }

    // Combine date and time into full Date objects
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDateTime = new Date(startDateObj);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(endDateObj);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    if (startDateTime <= new Date()) {
      toast.error('Meeting must be scheduled for a future date and time');
      return;
    }

    if (endDateTime <= startDateTime) {
      toast.error('End time must be after start time');
      return;
    }

    setLoading(true);
    try {
      await createMeetingRequest(
        title,
        description,
        startDateTime,
        endDateTime,
        selectedParticipants,
        location
      );
      
      toast.success('Meeting request sent successfully!');
      setOpen(false);
    } catch (error) {
      console.error('Error creating meeting request:', error);
      toast.error('Failed to send meeting request');
    } finally {
      setLoading(false);
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
            <Calendar className="h-4 w-4" />
            Schedule Meeting
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Meeting
          </DialogTitle>
          <DialogDescription>
            Create and send meeting invitations to participants
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Meeting Title *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter meeting title"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter meeting description"
              rows={3}
            />
          </div>

          <MeetingDateTimeSection
            label="Start Date & Time"
            date={startDateObj}
            onDateChange={setStartDateObj}
            timeInput={startTime}
            onTimeChange={setStartTime}
            required
          />
          
          <MeetingDateTimeSection
            label="End Date & Time"
            date={endDateObj}
            onDateChange={setEndDateObj}
            timeInput={endTime}
            onTimeChange={setEndTime}
            required
          />

          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1">
              Location
            </label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter meeting location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Participants *
            </label>
            <UserSelector
              users={users}
              selectedUserIds={selectedParticipants}
              onSelectionChange={setSelectedParticipants}
              placeholder="Select participants"
              multiple
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !title.trim() || selectedParticipants.length === 0 || !startDateObj || !endDateObj}
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