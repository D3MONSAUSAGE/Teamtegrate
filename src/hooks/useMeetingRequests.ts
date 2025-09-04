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
    // SECURITY FIX: Only fetch meetings where the user is involved
    // This prevents users from seeing meetings they're not part of
    
    // First, get meetings where user is the organizer
    const { data: organizedMeetings, error: organizedError } = await supabase
      .from('meeting_requests')
      .select(`
        *,
        meeting_participants (*)
      `)
      .eq('organizer_id', user.id)
      .eq('organization_id', user.organizationId)
      .order('start_time', { ascending: true });

    if (organizedError) throw organizedError;

    // Second, get meetings where user is a participant
    const { data: participantMeetings, error: participantError } = await supabase
      .from('meeting_requests')
      .select(`
        *,
        meeting_participants!inner (*)
      `)
      .eq('meeting_participants.user_id', user.id)
      .eq('organization_id', user.organizationId)
      .order('start_time', { ascending: true });

    if (participantError) throw participantError;

    // Combine and deduplicate meetings
    const allMeetingsMap = new Map();
    
    // Add organized meetings
    (organizedMeetings || []).forEach(meeting => {
      allMeetingsMap.set(meeting.id, meeting);
    });
    
    // Add participant meetings
    (participantMeetings || []).forEach(meeting => {
      allMeetingsMap.set(meeting.id, meeting);
    });

    const requests = Array.from(allMeetingsMap.values());

    // Collect all unique user IDs from participants and organizers
    const participantUserIds: string[] = (requests || []).flatMap((r: any) => (r.meeting_participants || []).map((p: any) => p.user_id));
    const organizerIds: string[] = (requests || []).map((r: any) => r.organizer_id).filter(Boolean);
    const allUserIds = Array.from(new Set([...(participantUserIds || []), ...(organizerIds || [])]));

    // Fetch user info in bulk
    let userMap = new Map<string, { name: string | null; email: string | null; avatar_url: string | null }>();
    if (allUserIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', allUserIds as any);
      if (usersError) throw usersError;
      usersData?.forEach(u => userMap.set(u.id, { name: u.name, email: u.email, avatar_url: u.avatar_url }));
    }

    const formattedRequests: MeetingRequestWithParticipants[] = (requests || []).map((request: any) => {
      const participants = (request.meeting_participants || []).map((p: any) => {
        const u = userMap.get(p.user_id) || { name: null, email: null, avatar_url: null };
        return {
          ...p,
          response_status: p.response_status as 'invited' | 'accepted' | 'declined' | 'tentative',
          user_name: u.name || undefined,
          user_email: u.email || undefined,
          user_avatar_url: u.avatar_url || undefined,
        } as MeetingParticipant;
      });

      const orgUser = userMap.get(request.organizer_id);

      return {
        ...request,
        participants,
        organizer_name: orgUser?.name || orgUser?.email || 'Unknown',
      } as MeetingRequestWithParticipants;
    });

    console.log(`🔒 Security: Fetched ${formattedRequests.length} meetings where user is involved`);
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

  const cancelMeeting = async (meetingId: string) => {
    if (!user) return null;

    try {
      console.log('🔄 Cancelling meeting:', { meetingId });

      // Get meeting details first to send notifications
      const meetingToCancel = meetingRequests.find(m => m.id === meetingId);
      if (!meetingToCancel) {
        throw new Error('Meeting not found');
      }

      // Update meeting status to cancelled
      const { error: meetingError } = await supabase
        .from('meeting_requests')
        .update({ status: 'cancelled' })
        .eq('id', meetingId);

      if (meetingError) throw meetingError;

      // Create notifications for all participants (excluding organizer)
      const participantNotifications = meetingToCancel.participants
        .filter(p => p.user_id !== user.id)
        .map(participant => ({
          user_id: participant.user_id,
          title: 'Meeting Cancelled',
          content: `The meeting "${meetingToCancel.title}" scheduled for ${new Date(meetingToCancel.start_time).toLocaleDateString()} has been cancelled`,
          type: 'meeting_cancellation',
          organization_id: user.organizationId,
        }));

      if (participantNotifications.length > 0) {
        await supabase.from('notifications').insert(participantNotifications);
      }

      toast({
        title: "Success",
        description: "Meeting cancelled successfully",
      });

      fetchMeetingRequests();
      return true;
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      toast({
        title: "Error",
        description: "Failed to cancel meeting",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateMeeting = async (
    meetingId: string,
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    participantIds: string[],
    location?: string
  ): Promise<boolean> => {
    try {
      // Get current meeting to compare changes
      const currentMeeting = meetingRequests?.find(m => m.id === meetingId);
      if (!currentMeeting) throw new Error('Meeting not found');

      // Update meeting
      const { error: updateError } = await supabase
        .from('meeting_requests')
        .update({
          title,
          description,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          location,
          updated_at: new Date().toISOString(),
        })
        .eq('id', meetingId);

      if (updateError) throw updateError;

      // Get current participants
      const currentParticipantIds = currentMeeting.participants?.map(p => p.user_id) || [];
      
      // Find participants to remove
      const participantsToRemove = currentParticipantIds.filter(id => !participantIds.includes(id));
      
      // Find participants to add
      const participantsToAdd = participantIds.filter(id => !currentParticipantIds.includes(id));

      // Remove participants no longer invited
      if (participantsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('meeting_participants')
          .delete()
          .eq('meeting_request_id', meetingId)
          .in('user_id', participantsToRemove);

        if (removeError) throw removeError;
      }

      // Add new participants
      if (participantsToAdd.length > 0) {
        const newParticipants = participantsToAdd.map(userId => ({
          meeting_request_id: meetingId,
          user_id: userId,
          response_status: 'invited' as const,
        }));

        const { error: addError } = await supabase
          .from('meeting_participants')
          .insert(newParticipants);

        if (addError) throw addError;
      }

      // Create notifications for all current participants about the update
      if (participantIds.length > 0) {
        const updateNotifications = participantIds.map(userId => ({
          user_id: userId,
          title: 'Meeting Updated',
          content: `The meeting "${title}" has been updated. Please review the new details.`,
          type: 'meeting_update',
          organization_id: user.organizationId,
        }));

        await supabase.from('notifications').insert(updateNotifications);
      }

      // Create notifications for newly added participants
      if (participantsToAdd.length > 0) {
        const inviteNotifications = participantsToAdd.map(userId => ({
          user_id: userId,
          title: 'Meeting Invitation',
          content: `You have been invited to the meeting "${title}" on ${startTime.toLocaleDateString()}.`,
          type: 'meeting_invitation',
          organization_id: user.organizationId,
        }));

        await supabase.from('notifications').insert(inviteNotifications);
      }

      // Refresh the meeting list
      await fetchMeetingRequests();
      return true;
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw error;
    }
  };

  const respondToMeeting = async (participantId: string, response: 'accepted' | 'declined' | 'tentative') => {
    try {
      console.log('🔄 Responding to meeting:', { participantId, response });
      
      // Optimistic update - immediately update local state
      setMeetingRequests(prev => prev.map(meeting => ({
        ...meeting,
        participants: meeting.participants.map(participant => 
          participant.id === participantId 
            ? { ...participant, response_status: response, responded_at: new Date().toISOString() }
            : participant
        )
      })));

      const { error } = await supabase
        .from('meeting_participants')
        .update({
          response_status: response,
          responded_at: new Date().toISOString(),
        })
        .eq('id', participantId);

      if (error) {
        console.error('❌ Database update failed:', error);
        // Revert optimistic update on error
        await fetchMeetingRequests();
        throw error;
      }

      console.log('✅ Meeting response updated successfully');
      
      toast({
        title: "Success",
        description: `Meeting invitation ${response}`,
      });

      // Fetch fresh data to ensure consistency
      await fetchMeetingRequests();
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
    console.log('🔄 Setting up real-time subscription for meetings');
    const channel = supabase
      .channel('meeting-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_requests'
        },
        (payload) => {
          console.log('📡 Meeting request real-time update:', payload);
          fetchMeetingRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_participants'
        },
        (payload) => {
          console.log('📡 Meeting participant real-time update:', payload);
          fetchMeetingRequests();
        }
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
    cancelMeeting,
    updateMeeting,
    respondToMeeting,
    fetchMeetingRequests,
  };
};