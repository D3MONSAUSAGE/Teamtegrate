import { supabase } from '@/integrations/supabase/client';
import { MeetingRequestWithParticipants } from '@/types/meeting';

interface User {
  id: string;
  organizationId?: string;
}

interface RespondToMeetingParams {
  participantId: string;
  response: 'accepted' | 'declined' | 'tentative';
  user: User | null;
  meetings: MeetingRequestWithParticipants[];
}

export const respondToMeetingAPI = async (params: RespondToMeetingParams) => {
  const { participantId, response, user, meetings } = params;
  
  console.log('🔄 Responding to meeting:', { participantId, response });
  
  // Find the meeting and participant details first
  const meeting = meetings.find(m => 
    m.participants.some(p => p.id === participantId)
  );
  const participant = meeting?.participants.find(p => p.id === participantId);
  
  if (!meeting || !participant) {
    throw new Error('Meeting or participant not found');
  }

  const { error } = await supabase
    .from('meeting_participants')
    .update({
      response_status: response,
      responded_at: new Date().toISOString(),
    })
    .eq('id', participantId);

  if (error) {
    console.error('❌ Database update failed:', error);
    throw error;
  }

  console.log('✅ Meeting response updated successfully');

  // Notify the organizer about the participant's response
  if (meeting.organizer_id !== user?.id && user?.organizationId) {
    const responseTypeMap = {
      accepted: 'Accepted',
      declined: 'Declined', 
      tentative: 'Tentative'
    };

    const participantName = participant.user_name || participant.user_email || 'Someone';
    const notificationTitle = `Meeting Response: ${responseTypeMap[response]}`;
    const notificationContent = `${participantName} ${response} the invitation for "${meeting.title}"`;

    console.log('📧 Sending organizer notification:', {
      organizer_id: meeting.organizer_id,
      participant_name: participantName,
      response_type: response,
      meeting_title: meeting.title
    });

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: meeting.organizer_id,
        title: notificationTitle,
        content: notificationContent,
        type: 'meeting_response',
        organization_id: user.organizationId,
      });

    if (notificationError) {
      console.error('❌ Failed to create organizer notification:', notificationError);
    } else {
      console.log('✅ Organizer notification created successfully');
    }

    // Send email notification using the new professional edge function
    try {
      console.log('📧 Sending professional email notification to organizer');
      
      // Fetch organizer email details
      const { data: organizerData } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', meeting.organizer_id)
        .single();

      if (organizerData) {
        const emailPayload = {
          version: 'v1',
          type: 'response',
          organizer: {
            id: organizerData.id,
            email: organizerData.email,
            name: organizerData.name
          },
          participants: [{
            id: participant.user_id,
            email: participant.user_email || '',
            name: participant.user_name
          }],
          meeting: {
            id: meeting.id,
            title: meeting.title,
            location: meeting.location,
            startISO: meeting.start_time,
            endISO: meeting.end_time,
            notes: meeting.description
          },
          responder: {
            id: participant.user_id,
            name: participant.user_name,
            response: response
          }
        };

        // Generate idempotency key for response
        const idempotencyKey = `${meeting.id}:response:${participant.user_id}:${response}:${Date.now()}`;

        const { error: emailError } = await supabase.functions.invoke('send-meeting-notifications', {
          body: emailPayload,
          headers: {
            'Idempotency-Key': idempotencyKey
          }
        });

        if (emailError) {
          console.error('❌ Failed to send professional email notification:', emailError);
        } else {
          console.log('✅ Professional email notification sent successfully');
        }
      } else {
        console.warn('⚠️ Could not fetch organizer email details');
      }
    } catch (emailError) {
      console.error('❌ Error sending professional email notification:', emailError);
    }
  }
};