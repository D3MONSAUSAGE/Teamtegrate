import { supabase } from '@/integrations/supabase/client';
import { MeetingRequestWithParticipants, MeetingParticipant } from '@/types/meeting';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: string;
  organizationId?: string;
  email?: string;
}

export const fetchMeetingRequestsAPI = async (user: User): Promise<MeetingRequestWithParticipants[]> => {
  if (!user.organizationId) {
    console.log('🔄 fetchMeetingRequests: No organizationId, skipping fetch');
    return [];
  }

  // Validate organizationId format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(user.organizationId)) {
    console.log('🔄 fetchMeetingRequests: Invalid organizationId format, skipping fetch');
    return [];
  }
  
  console.log('🔄 fetchMeetingRequests: Starting fetch for user:', user.email, 'org:', user.organizationId);
  
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
  return formattedRequests;
};

interface CreateMeetingParams {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  participantIds: string[];
  location?: string;
  user: User;
  timezone?: string;
}

export const createMeetingRequestAPI = async (params: CreateMeetingParams) => {
  const { title, description, startTime, endTime, participantIds, location, user, timezone } = params;
  
  if (!user.organizationId) {
    toast({
      title: "Error",
      description: "Please wait for your profile to load before creating meetings",
      variant: "destructive",
    });
    return null;
  }

  // Check if user has Google Calendar connected for enhanced feedback
  const { data: userData } = await supabase
    .from('users')
    .select('google_calendar_sync_enabled, google_refresh_token')
    .eq('id', user.id)
    .single();

  const hasGoogleCalendar = userData?.google_calendar_sync_enabled && userData?.google_refresh_token;

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
    .maybeSingle();

  if (meetingError) throw meetingError;

  // Add participants
  const participants = participantIds.map(userId => ({
    meeting_request_id: meeting.id,
    user_id: userId,
    organization_id: user.organizationId,
  }));

  const { error: participantsError } = await supabase
    .from('meeting_participants')
    .insert(participants);

  if (participantsError) throw participantsError;

  // Create notifications with push for participants
  for (const userId of participantIds) {
    await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        title: 'Meeting Invitation',
        content: `You've been invited to: ${title}`,
        type: 'meeting_invitation',
        metadata: {
          meeting_id: meeting.id,
          route: '/dashboard/meetings'
        },
        organization_id: user.organizationId,
        send_push: true
      }
    });
  }

  // Fetch organizer and participant details for email notification with their timezones
  try {
    const { data: organizerData } = await supabase
      .from('users')
      .select('id, email, name, timezone')
      .eq('id', user.id)
      .single();

    const { data: participantData } = await supabase
      .from('users')
      .select('id, email, name, timezone')
      .in('id', participantIds);

    if (organizerData && participantData) {
      console.log('📧 Preparing email with timezone info:', {
        organizer: { email: organizerData.email, timezone: organizerData.timezone || 'UTC' },
        participants: participantData.map(p => ({ email: p.email, timezone: p.timezone || 'UTC' }))
      });

      // Send meeting invitation emails with timezone information
      const emailPayload = {
        version: 'v1',
        type: 'created',
        organizer: {
          id: organizerData.id,
          email: organizerData.email,
          name: organizerData.name,
          timezone: organizerData.timezone || timezone || 'UTC'
        },
        participants: participantData.map(p => ({
          id: p.id,
          email: p.email,
          name: p.name,
          timezone: p.timezone || 'UTC'
        })),
        meeting: {
          id: meeting.id,
          title: title,
          location: location,
          startISO: startTime.toISOString(),
          endISO: endTime.toISOString(),
          notes: description,
          timezone: timezone || 'UTC'
        }
      };

      // Generate idempotency key
      const idempotencyKey = `${meeting.id}:created:${startTime.toISOString()}:${participantIds.sort().join(',')}`;

      await supabase.functions.invoke('send-meeting-notifications', {
        body: emailPayload,
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      });

      console.log('Meeting invitation emails sent successfully');
    }
  } catch (emailError) {
    console.error('Failed to send meeting invitation emails:', emailError);
    // Don't fail the meeting creation if emails fail
  }

  // Enhanced success message based on Google Calendar status
  const successMessage = hasGoogleCalendar 
    ? "Meeting created and syncing to Google Calendar. Participants will receive email invitations and Google Calendar invites."
    : "Meeting request sent successfully. Participants will receive email invitations. Connect Google Calendar to automatically send calendar invites.";

  toast({
    title: "Success",
    description: successMessage,
  });

  return meeting;
};

interface UpdateMeetingParams {
  meetingId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  participantIds: string[];
  location?: string;
  user: User;
  currentMeetings: MeetingRequestWithParticipants[];
}

export const updateMeetingAPI = async (params: UpdateMeetingParams): Promise<boolean> => {
  const { meetingId, title, description, startTime, endTime, participantIds, location, user, currentMeetings } = params;
  
  if (!user.organizationId) {
    toast({
      title: "Error",
      description: "Please wait for your profile to load before updating meetings",
      variant: "destructive",
    });
    return false;
  }

  // Get current meeting to compare changes
  const currentMeeting = currentMeetings?.find(m => m.id === meetingId);
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
      organization_id: user.organizationId,
    }));

    const { error: addError } = await supabase
      .from('meeting_participants')
      .insert(newParticipants);

    if (addError) throw addError;
  }

  // Create notifications with push for all current participants about the update
  if (participantIds.length > 0) {
    for (const userId of participantIds) {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: userId,
          title: 'Meeting Updated',
          content: `The meeting "${title}" has been updated. Please review the new details.`,
          type: 'meeting_update',
          metadata: {
            meeting_id: meetingId,
            route: '/dashboard/meetings'
          },
          organization_id: user.organizationId,
          send_push: true
        }
      });
    }
  }

  // Create notifications with push for newly added participants
  if (participantsToAdd.length > 0) {
    for (const userId of participantsToAdd) {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: userId,
          title: 'Meeting Invitation',
          content: `You have been invited to the meeting "${title}" on ${startTime.toLocaleDateString()}.`,
          type: 'meeting_invitation',
          metadata: {
            meeting_id: meetingId,
            route: '/dashboard/meetings'
          },
          organization_id: user.organizationId,
          send_push: true
        }
      });
    }
  }

  return true;
};

interface CancelMeetingParams {
  meetingId: string;
  user: User;
  meetings: MeetingRequestWithParticipants[];
}

export const cancelMeetingAPI = async (params: CancelMeetingParams) => {
  const { meetingId, user, meetings } = params;
  
  if (!user.organizationId) {
    toast({
      title: "Error",
      description: "Please wait for your profile to load before cancelling meetings",
      variant: "destructive",
    });
    return null;
  }

  console.log('🔄 Cancelling meeting:', { meetingId });

  // Get meeting details first to send notifications
  const meetingToCancel = meetings.find(m => m.id === meetingId);
  if (!meetingToCancel) {
    throw new Error('Meeting not found');
  }

  // Update meeting status to cancelled
  const { error: meetingError } = await supabase
    .from('meeting_requests')
    .update({ status: 'cancelled' })
    .eq('id', meetingId);

  if (meetingError) throw meetingError;

  // Create notifications with push for all participants (excluding organizer)
  const participantsToNotify = meetingToCancel.participants.filter(p => p.user_id !== user.id);

  for (const participant of participantsToNotify) {
    await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: participant.user_id,
        title: 'Meeting Cancelled',
        content: `The meeting "${meetingToCancel.title}" scheduled for ${new Date(meetingToCancel.start_time).toLocaleDateString()} has been cancelled`,
        type: 'meeting_cancellation',
        metadata: {
          meeting_id: meetingId,
          route: '/dashboard/meetings'
        },
        organization_id: user.organizationId,
        send_push: true
      }
    });
  }

  toast({
    title: "Success",
    description: "Meeting cancelled successfully",
  });

  return true;
};