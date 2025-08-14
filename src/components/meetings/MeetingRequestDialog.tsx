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
  const [startDate, setStartDate] = useState(defaultDate.toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(
    new Date(defaultDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { createMeetingRequest } = useMeetingRequests();
  const { users } = useOrganizationUsers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedParticipants.length === 0) return;

    setLoading(true);
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
      setTitle('');
      setDescription('');
      setLocation('');
      setSelectedParticipants([]);
    }
    setLoading(false);
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
                onChange={(e) => setStartDate(e.target.value)}
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
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !title.trim() || selectedParticipants.length === 0}
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