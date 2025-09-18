import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  MoreHorizontal,
  UserCheck,
  UserX,
  UserMinus,
  Video
} from 'lucide-react';
import { format } from 'date-fns';
import { MeetingRequestWithParticipants } from '@/types/meeting';
import { MeetingSyncStatus } from './MeetingSyncStatus';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MeetingCardProps {
  meeting: MeetingRequestWithParticipants;
  currentUserId?: string;
  onRespond?: (participantId: string, response: 'accepted' | 'declined' | 'tentative') => void;
  onCancel?: (meetingId: string) => void;
  onEdit?: (meeting: MeetingRequestWithParticipants) => void;
  showActions?: boolean;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  currentUserId,
  onRespond,
  onCancel,
  onEdit,
  showActions = true
}) => {
  const isOrganizer = meeting.organizer_id === currentUserId;
  const currentUserParticipant = meeting.participants?.find(p => p.user_id === currentUserId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getResponseIcon = (response: string) => {
    switch (response) {
      case 'accepted': return <UserCheck className="h-3 w-3 text-green-600" />;
      case 'declined': return <UserX className="h-3 w-3 text-red-600" />;
      case 'tentative': return <UserMinus className="h-3 w-3 text-yellow-600" />;
      default: return <Users className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{meeting.title}</h3>
              <Badge className={getStatusColor(meeting.status)}>
                {meeting.status}
              </Badge>
              {meeting.google_meet_url && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Video className="h-3 w-3 mr-1" />
                  Google Meet
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(meeting.start_time), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(meeting.start_time), 'h:mm a')} - {format(new Date(meeting.end_time), 'h:mm a')}
              </div>
              {meeting.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {meeting.location}
                </div>
              )}
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOrganizer && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit?.(meeting)}>
                      Edit Meeting
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onCancel?.(meeting.id)}
                      className="text-red-600"
                    >
                      Cancel Meeting
                    </DropdownMenuItem>
                  </>
                )}
                {!isOrganizer && currentUserParticipant && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => onRespond?.(currentUserParticipant.id, 'accepted')}
                    >
                      Accept
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onRespond?.(currentUserParticipant.id, 'tentative')}
                    >
                      Maybe
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onRespond?.(currentUserParticipant.id, 'declined')}
                      className="text-red-600"
                    >
                      Decline
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {meeting.description && (
          <p className="text-sm text-muted-foreground">{meeting.description}</p>
        )}

        <div>
          <p className="text-sm font-medium mb-2">Organizer</p>
          <p className="text-sm text-muted-foreground">{meeting.organizer_name}</p>
        </div>

        {meeting.participants && meeting.participants.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Participants ({meeting.participants.length})</p>
            <div className="flex flex-wrap gap-2">
              {meeting.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-full"
                >
                  {getResponseIcon(participant.response_status)}
                  <span className="text-xs">
                    {participant.user_name || participant.user_email || 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <MeetingSyncStatus
          meetingId={meeting.id}
          syncStatus={meeting.sync_status}
          googleEventId={meeting.google_event_id}
          googleMeetUrl={meeting.google_meet_url}
          showActions={isOrganizer}
        />
      </CardContent>
    </Card>
  );
};

export default MeetingCard;