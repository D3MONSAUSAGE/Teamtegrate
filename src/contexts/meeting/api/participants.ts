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

    // Send email notification using edge function
    try {
      console.log('📧 Sending email notification to organizer');
      
      const { error: emailError } = await supabase.functions.invoke('send-meeting-notification', {
        body: {
          organizer_email: meeting.organizer_name,
          organizer_name: meeting.organizer_name,
          participant_name: participantName,
          meeting_title: meeting.title,
          meeting_start_time: meeting.start_time,
          meeting_location: meeting.location,
          response_type: response
        }
      });

      if (emailError) {
        console.error('❌ Failed to send email notification:', emailError);
      } else {
        console.log('✅ Email notification sent successfully');
      }
    } catch (emailError) {
      console.error('❌ Error sending email notification:', emailError);
    }
  }
};