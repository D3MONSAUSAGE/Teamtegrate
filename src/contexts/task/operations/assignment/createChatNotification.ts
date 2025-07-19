
import { supabase } from '@/integrations/supabase/client';

/**
 * Create a notification for chat messages
 */
export const createChatMessageNotification = async (
  roomId: string,
  senderId: string,
  senderName: string,
  messageContent: string,
  organizationId: string
): Promise<void> => {
  try {
    // Get all participants in the room except the sender
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('room_id', roomId)
      .neq('user_id', senderId);

    if (participantsError) {
      console.error('Error fetching chat participants:', participantsError);
      return;
    }

    if (!participants || participants.length === 0) {
      return;
    }

    // Get room name for notification
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('name')
      .eq('id', roomId)
      .single();

    const roomName = room?.name || 'Chat';
    
    // Create notifications for all participants except sender
    const notifications = participants.map(participant => ({
      user_id: participant.user_id,
      title: `New message in ${roomName}`,
      content: `${senderName}: ${messageContent.length > 100 ? messageContent.substring(0, 100) + '...' : messageContent}`,
      type: 'chat_message',
      organization_id: organizationId,
      metadata: {
        room_id: roomId,
        sender_id: senderId,
        route: '/dashboard/chat'
      }
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating chat message notifications:', error);
    } else {
      console.log(`Created ${notifications.length} chat message notifications`);
    }
  } catch (error) {
    console.error('Error in createChatMessageNotification:', error);
  }
};

/**
 * Create notification for chat room invitations
 */
export const createChatInviteNotification = async (
  userId: string,
  roomName: string,
  inviterName: string,
  organizationId: string
): Promise<void> => {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Chat Room Invitation',
      content: `${inviterName} invited you to join "${roomName}"`,
      type: 'chat_invitation',
      organization_id: organizationId,
      metadata: {
        route: '/dashboard/chat'
      }
    });
    
    console.log('Chat invitation notification created for user:', userId);
  } catch (error) {
    console.error('Error sending chat invitation notification:', error);
  }
};
