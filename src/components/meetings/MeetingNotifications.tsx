import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Calendar } from 'lucide-react';
import { MeetingInvitationCard } from './MeetingInvitationCard';
import { useMeetingRequests } from '@/hooks/useMeetingRequests';
import { useAuth } from '@/contexts/auth/AuthProvider';

export const MeetingNotifications: React.FC = () => {
  const { user } = useAuth();
  const { meetingRequests, loading } = useMeetingRequests();

  // Filter for all meetings where user is involved (organizer or participant)
  const userMeetings = meetingRequests.filter(meeting => {
    const userParticipant = meeting.participants.find(p => p.user_id === user?.id);
    return meeting.organizer_id === user?.id || userParticipant;
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading meetings...</div>
        </CardContent>
      </Card>
    );
  }

  if (userMeetings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No meetings scheduled</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          My Meetings ({userMeetings.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {userMeetings.map(meeting => {
          const isOrganizer = meeting.organizer_id === user?.id;
          return (
            <MeetingInvitationCard 
              key={meeting.id} 
              meeting={meeting} 
              showActions={!isOrganizer}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};