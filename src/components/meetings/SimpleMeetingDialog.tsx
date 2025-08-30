import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, MapPin, Users, Send } from 'lucide-react';
import { useMeetingRequests } from '@/hooks/useMeetingRequests';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { useToast } from '@/hooks/use-toast';
import { format, parse, isValid } from 'date-fns';

interface SimpleMeetingDialogProps {
  trigger?: React.ReactNode;
  defaultDate?: Date;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SimpleMeetingDialog: React.FC<SimpleMeetingDialogProps> = ({
  trigger,
  defaultDate,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}) => {
  const { createMeetingRequest } = useMeetingRequests();
  const { users } = useOrganizationUsers();
  const { toast } = useToast();
  
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    participants: [] as string[]
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : '',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      participants: []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date || !formData.startTime || !formData.endTime) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.participants.length === 0) {
      toast({
        title: "No participants",
        description: "Please select at least one participant.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const startDateTime = parse(`${formData.date} ${formData.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
      const endDateTime = parse(`${formData.date} ${formData.endTime}`, 'yyyy-MM-dd HH:mm', new Date());

      if (!isValid(startDateTime) || !isValid(endDateTime)) {
        throw new Error('Invalid date or time format');
      }

      if (endDateTime <= startDateTime) {
        toast({
          title: "Invalid time",
          description: "End time must be after start time.",
          variant: "destructive",
        });
        return;
      }

      await createMeetingRequest(
        formData.title,
        formData.description,
        startDateTime,
        endDateTime,
        formData.participants,
        formData.location || undefined
      );

      toast({
        title: "Meeting scheduled",
        description: "Meeting invitations have been sent to participants.",
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParticipantChange = (userId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      participants: checked 
        ? [...prev.participants, userId]
        : prev.participants.filter(id => id !== userId)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule New Meeting
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter meeting title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Meeting description (optional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Meeting location (optional)"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4" />
              Participants * ({formData.participants.length} selected)
            </Label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.participants.includes(user.id)}
                    onChange={(e) => handleParticipantChange(user.id, e.target.checked)}
                    className="rounded border-border"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                      {user.role}
                    </span>
                  </div>
                </label>
              ))}
              {users.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No users available
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || formData.participants.length === 0}
              className="min-w-[140px]"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Sending...' : 'Send Invitations'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};