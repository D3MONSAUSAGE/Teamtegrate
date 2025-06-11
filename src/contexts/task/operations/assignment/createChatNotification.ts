
import { supabase } from '@/integrations/supabase/client';

/**
 * Create notifications for chat messages to all room participants except sender
 */
export const createChatMessageNotification = async (
  roomId: string,
  senderId: string,
  senderName: string,
  roomName: string,
  messageContent: string
): Promise<void> => {
  try {
    // Get sender's organization
    const { data: senderData, error: senderError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', senderId)
      .single();

    if (senderError || !senderData?.organization_id) {
      console.error('Error fetching sender organization:', senderError);
      return;
    }

    // Get all participants in the room except the sender
    const { data: participants, error: participantsError } = await supabase
      .from('chat_room_participants')
      .select('user_id')
      .eq('room_id', roomId)
      .neq('user_id', senderId);

    if (participantsError) {
      console.error('Error fetching chat room participants:', participantsError);
      return;
    }

    if (!participants || participants.length === 0) {
      console.log('No participants to notify in room:', roomId);
      return;
    }

    // Create notifications for all participants
    const notifications = participants.map(participant => ({
      user_id: participant.user_id,
      title: `New message in ${roomName}`,
      content: `${senderName}: ${messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent}`,
      type: 'chat_message',
      organization_id: senderData.organization_id
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Error creating chat notifications:', notificationError);
    } else {
      console.log(`Created ${notifications.length} chat notifications for room:`, roomId);
    }
  } catch (error) {
    console.error('Error in createChatMessageNotification:', error);
  }
};
