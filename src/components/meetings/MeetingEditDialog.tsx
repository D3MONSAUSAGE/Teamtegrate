import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import MeetingDateTimeSection from './MeetingDateTimeSection';
import { UserSelector } from '@/components/ui/user-selector';
import { useMeetingRequests } from '@/hooks/useMeetingRequests';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { MeetingRequestWithParticipants } from '@/types/meeting';

interface MeetingEditDialogProps {
  meeting: MeetingRequestWithParticipants | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MeetingEditDialog: React.FC<MeetingEditDialogProps> = ({
  meeting,
  open,
  onOpenChange,
}) => {
  const { updateMeeting, loading } = useMeetingRequests();
  const { users } = useOrganizationUsers();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  // Initialize form when meeting changes
  useEffect(() => {
    if (meeting && open) {
      setTitle(meeting.title);
      setDescription(meeting.description || '');
      setLocation(meeting.location || '');
      
      const startDateTime = new Date(meeting.start_time);
      const endDateTime = new Date(meeting.end_time);
      
      setStartDate(startDateTime);
      setEndDate(endDateTime);
      setStartTime(format(startDateTime, 'HH:mm'));
      setEndTime(format(endDateTime, 'HH:mm'));
      
      // Set current participants
      const participantIds = meeting.participants?.map(p => p.user_id) || [];
      setSelectedParticipants(participantIds);
    }
  }, [meeting, open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setStartDate(undefined);
    setEndDate(undefined);
    setStartTime('');
    setEndTime('');
    setSelectedParticipants([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!meeting) return;

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Meeting title is required.",
        variant: "destructive",
      });
      return;
    }

    if (!startDate || !endDate || !startTime || !endTime) {
      toast({
        title: "Error", 
        description: "Please select both start and end date/time.",
        variant: "destructive",
      });
      return;
    }

    if (selectedParticipants.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one participant.",
        variant: "destructive",
      });
      return;
    }

    // Create datetime objects
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(endDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    if (startDateTime >= endDateTime) {
      toast({
        title: "Error",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await updateMeeting(
        meeting.id,
        title.trim(),
        description.trim(),
        startDateTime,
        endDateTime,
        selectedParticipants,
        location.trim()
      );

      if (success) {
        toast({
          title: "Success",
          description: "Meeting updated successfully. Participants will be notified of changes.",
        });
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating meeting:', error);
      toast({
        title: "Error",
        description: "Failed to update meeting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isFormValid = title.trim() && startDate && endDate && startTime && endTime && selectedParticipants.length > 0;

  if (!meeting) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Edit Meeting
          </DialogTitle>
          <DialogDescription>
            Update meeting details. All participants will be notified of any changes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Meeting Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter meeting title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Meeting Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter meeting description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MeetingDateTimeSection
              label="Start Date & Time"
              date={startDate}
              onDateChange={setStartDate}
              timeInput={startTime}
              onTimeChange={setStartTime}
              required
            />
            <MeetingDateTimeSection
              label="End Date & Time"
              date={endDate}
              onDateChange={setEndDate}
              timeInput={endTime}
              onTimeChange={setEndTime}
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              type="text"
              placeholder="Enter meeting location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants *
            </Label>
            <UserSelector
              users={users || []}
              selectedUserIds={selectedParticipants}
              onSelectionChange={setSelectedParticipants}
              placeholder="Select meeting participants..."
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Updating...' : 'Update Meeting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};