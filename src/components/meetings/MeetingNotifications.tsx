import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Calendar } from 'lucide-react';
import { MeetingInvitationCard } from './MeetingInvitationCard';
import { useMeetingRequests } from '@/hooks/useMeetingRequests';
import { useAuth } from '@/contexts/auth/AuthProvider';

export const MeetingNotifications: React.FC = () => {
  const { user } = useAuth();
  const { meetingRequests, loading } = useMeetingRequests();

  // Filter for meetings where user is invited and hasn't responded
  const pendingInvitations = meetingRequests.filter(meeting => {
    const userParticipant = meeting.participants.find(p => p.user_id === user?.id);
    return userParticipant?.response_status === 'invited' && meeting.organizer_id !== user?.id;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Meeting Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading invitations...</div>
        </CardContent>
      </Card>
    );
  }

  if (pendingInvitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Meeting Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending meeting invitations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Meeting Invitations ({pendingInvitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingInvitations.map(meeting => (
          <MeetingInvitationCard key={meeting.id} meeting={meeting} />
        ))}
      </CardContent>
    </Card>
  );
};