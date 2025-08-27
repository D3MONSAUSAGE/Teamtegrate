import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Check, X, Clock3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { MeetingRequestWithParticipants, MeetingParticipant } from '@/types/meeting';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { useMeetingRequests } from '@/hooks/useMeetingRequests';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MeetingInvitationCardProps {
  meeting: MeetingRequestWithParticipants;
  showActions?: boolean;
}

export const MeetingInvitationCard: React.FC<MeetingInvitationCardProps> = ({ 
  meeting, 
  showActions = true 
}) => {
  const { user } = useAuth();
  const { respondToMeeting, cancelMeeting } = useMeetingRequests();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const userParticipant = meeting.participants.find(p => p.user_id === user?.id);
  const isOrganizer = meeting.organizer_id === user?.id;

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      confirmed: 'default',
      cancelled: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const getResponseBadge = (response: string) => {
    const config = {
      invited: { variant: 'outline' as const, icon: Clock3, text: 'Pending' },
      accepted: { variant: 'default' as const, icon: Check, text: 'Accepted' },
      declined: { variant: 'destructive' as const, icon: X, text: 'Declined' },
      tentative: { variant: 'secondary' as const, icon: Clock3, text: 'Tentative' }
    };

    const { variant, icon: Icon, text } = config[response as keyof typeof config] || config.invited;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const handleResponse = (response: 'accepted' | 'declined' | 'tentative') => {
    if (userParticipant) {
      respondToMeeting(userParticipant.id, response);
    }
  };

  const handleCancelMeeting = () => {
    cancelMeeting(meeting.id);
    setShowCancelDialog(false);
  };

  const startTime = new Date(meeting.start_time);
  const endTime = new Date(meeting.end_time);
  const isPastMeeting = startTime < new Date();

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold leading-none">{meeting.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Organized by {meeting.organizer_name || 'Unknown'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userParticipant && getResponseBadge(userParticipant.response_status)}
            {getStatusBadge(meeting.status)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {meeting.description && (
          <p className="text-sm text-muted-foreground">{meeting.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(startTime, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </span>
          </div>

          {meeting.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{meeting.location}</span>
            </div>
          )}
        </div>

        {showActions && (
          <>
            {/* Organizer cancel button */}
            {isOrganizer && !isPastMeeting && meeting.status !== 'cancelled' && (
              <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1 mb-2 w-full">
                    <Trash2 className="h-4 w-4" />
                    Cancel Meeting
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Meeting</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel "{meeting.title}"? All invited participants will be notified of the cancellation. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Meeting</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelMeeting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Cancel Meeting
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Participant response buttons */}
            {userParticipant && !isPastMeeting && meeting.status !== 'cancelled' && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResponse('accepted')}
                  disabled={userParticipant.response_status === 'accepted'}
                  className="gap-1 flex-1"
                >
                  <Check className="h-4 w-4" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResponse('tentative')}
                  disabled={userParticipant.response_status === 'tentative'}
                  className="gap-1 flex-1"
                >
                  <Clock3 className="h-4 w-4" />
                  Tentative
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResponse('declined')}
                  disabled={userParticipant.response_status === 'declined'}
                  className="gap-1 flex-1"
                >
                  <X className="h-4 w-4" />
                  Decline
                </Button>
              </div>
            )}
          </>
        )}

        {meeting.participants.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''} invited
          </div>
        )}
      </CardContent>
    </Card>
  );
};