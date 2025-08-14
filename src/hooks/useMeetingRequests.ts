import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { MeetingRequest, MeetingParticipant, MeetingRequestWithParticipants } from '@/types/meeting';
import { useToast } from '@/components/ui/use-toast';

export const useMeetingRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequestWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetingRequests = async () => {
    if (!user) return;
    
    try {
      const { data: requests, error } = await supabase
        .from('meeting_requests')
        .select(`
          *,
          meeting_participants (*)
        `)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedRequests: MeetingRequestWithParticipants[] = requests.map((request: any) => ({
        ...request,
        participants: (request.meeting_participants || []).map((p: any) => ({
          ...p,
          response_status: p.response_status as 'invited' | 'accepted' | 'declined' | 'tentative'
        })),
        organizer_name: 'Unknown'
      }));

      setMeetingRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching meeting requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch meeting requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createMeetingRequest = async (
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    participantIds: string[],
    location?: string
  ) => {
    if (!user) return null;

    try {
      const { data: meeting, error: meetingError } = await supabase
        .from('meeting_requests')
        .insert({
          title,
          description,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          location,
          organizer_id: user.id,
          organization_id: user.organizationId,
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // Add participants
      const participants = participantIds.map(userId => ({
        meeting_request_id: meeting.id,
        user_id: userId,
      }));

      const { error: participantsError } = await supabase
        .from('meeting_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      // Create notifications for participants
      const notifications = participantIds.map(userId => ({
        user_id: userId,
        title: 'Meeting Invitation',
        content: `You've been invited to: ${title}`,
        type: 'meeting_invitation',
        organization_id: user.organizationId,
      }));

      await supabase.from('notifications').insert(notifications);

      toast({
        title: "Success",
        description: "Meeting request sent successfully",
      });

      fetchMeetingRequests();
      return meeting;
    } catch (error) {
      console.error('Error creating meeting request:', error);
      toast({
        title: "Error",
        description: "Failed to create meeting request",
        variant: "destructive",
      });
      return null;
    }
  };

  const respondToMeeting = async (participantId: string, response: 'accepted' | 'declined' | 'tentative') => {
    try {
      const { error } = await supabase
        .from('meeting_participants')
        .update({
          response_status: response,
          responded_at: new Date().toISOString(),
        })
        .eq('id', participantId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Meeting invitation ${response}`,
      });

      fetchMeetingRequests();
    } catch (error) {
      console.error('Error responding to meeting:', error);
      toast({
        title: "Error",
        description: "Failed to respond to meeting invitation",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMeetingRequests();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('meeting-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_requests'
        },
        () => fetchMeetingRequests()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_participants'
        },
        () => fetchMeetingRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    meetingRequests,
    loading,
    createMeetingRequest,
    respondToMeeting,
    fetchMeetingRequests,
  };
};