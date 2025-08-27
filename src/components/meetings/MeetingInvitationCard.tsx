import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Check, X, UserCheck, Ban, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { useMeetingRequests } from '@/hooks/useMeetingRequests';
import { MeetingEditDialog } from './MeetingEditDialog';
import { MeetingParticipantsList } from './MeetingParticipantsList';
import type { MeetingRequestWithParticipants } from '@/types/meeting';
import { format } from 'date-fns';

interface MeetingInvitationCardProps {
  meeting: MeetingRequestWithParticipants;
  showActions?: boolean;
}

export const MeetingInvitationCard: React.FC<MeetingInvitationCardProps> = ({ meeting, showActions = true }) => {
  const { user } = useAuth();
  const { respondToMeeting, cancelMeeting } = useMeetingRequests();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const handleResponse = async (response: 'accepted' | 'declined' | 'tentative') => {
    const currentUserParticipant = meeting.participants?.find(p => p.user_id === user?.id);
    if (currentUserParticipant) {
      await respondToMeeting(currentUserParticipant.id, response);
    }
  };

  const handleCancelMeeting = () => {
    cancelMeeting(meeting.id);
    setShowCancelDialog(false);
  };

  const isOrganizer = meeting.organizer_id === user?.id;
  const currentUserParticipant = meeting.participants?.find(p => p.user_id === user?.id);
  const isPastMeeting = new Date(meeting.start_time) < new Date();
  const canCancel = isOrganizer && !isPastMeeting && meeting.status !== 'cancelled';
  const canEdit = isOrganizer && !isPastMeeting && meeting.status !== 'cancelled';
  const canRespond = currentUserParticipant && !isPastMeeting && meeting.status !== 'cancelled';

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: 'secondary' as const, text: 'Pending' },
      confirmed: { variant: 'default' as const, text: 'Confirmed' },
      cancelled: { variant: 'destructive' as const, text: 'Cancelled' }
    };
    
    const { variant, text } = config[status as keyof typeof config] || config.pending;
    return <Badge variant={variant}>{text}</Badge>;
  };

  const getResponseBadge = (response: string) => {
    const config = {
      invited: { variant: 'outline' as const, icon: Clock, text: 'Pending', color: 'text-slate-600' },
      accepted: { variant: 'secondary' as const, icon: Check, text: 'Accepted', color: 'text-emerald-600' },
      declined: { variant: 'outline' as const, icon: X, text: 'Declined', color: 'text-red-600' },
      tentative: { variant: 'outline' as const, icon: UserCheck, text: 'Tentative', color: 'text-amber-600' }
    };

    const { variant, icon: Icon, text, color } = config[response as keyof typeof config] || config.invited;

    return (
      <Badge variant={variant} className={`gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const startTime = new Date(meeting.start_time);
  const endTime = new Date(meeting.end_time);

  return (
    <>
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{meeting.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Organized by {meeting.organizer_name || 'Unknown'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentUserParticipant && getResponseBadge(currentUserParticipant.response_status)}
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

          {/* Participants List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowParticipants(!showParticipants)}
                className="text-xs text-muted-foreground h-auto p-0 hover:no-underline"
              >
                <Users className="h-3 w-3 mr-1" />
                {meeting.participants?.length || 0} participants
              </Button>
            </div>
            
            {!showParticipants && (
              <MeetingParticipantsList 
                participants={meeting.participants || []} 
                organizerName={meeting.organizer_name}
                compact={true}
              />
            )}
            
            {showParticipants && (
              <MeetingParticipantsList 
                participants={meeting.participants || []} 
                organizerName={meeting.organizer_name}
                compact={false}
              />
            )}
          </div>

          {/* Action buttons */}
          {showActions && (canRespond || canEdit || canCancel) && (
            <div className="flex gap-2 pt-4 border-t">
              {/* Response buttons for participants */}
              {canRespond && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={currentUserParticipant?.response_status === 'accepted' ? 'default' : 'outline'}
                    onClick={() => handleResponse('accepted')}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant={currentUserParticipant?.response_status === 'tentative' ? 'default' : 'outline'}
                    onClick={() => handleResponse('tentative')}
                    className="flex items-center gap-1"
                  >
                    <UserCheck className="h-3 w-3" />
                    Tentative
                  </Button>
                  <Button
                    size="sm"
                    variant={currentUserParticipant?.response_status === 'declined' ? 'destructive' : 'outline'}
                    onClick={() => handleResponse('declined')}
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Decline
                  </Button>
                </div>
              )}

              {/* Edit button for organizers */}
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditDialog(true)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
              )}

              {/* Cancel button for organizers */}
              {canCancel && (
                <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex items-center gap-1"
                    >
                      <Ban className="h-3 w-3" />
                      Cancel Meeting
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Meeting</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this meeting? All participants will be notified and this action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Meeting</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelMeeting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Cancel Meeting
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Meeting Dialog */}
      <MeetingEditDialog
        meeting={meeting}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
};