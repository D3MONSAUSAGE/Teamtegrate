import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useEnhancedChatNotifications = () => {
  const { user } = useAuth();

  // Send chat message notification via FCM
  const sendChatNotification = useCallback(async (
    roomId: string,
    senderId: string,
    messageContent: string,
    roomName?: string
  ) => {
    if (!user || senderId === user.id) return;

    try {
      // Get all participants in the room except the sender
      const { data: participants, error: participantsError } = await supabase
        .from('chat_participants')
        .select(`
          user_id,
          users!inner(id, name, organization_id)
        `)
        .eq('room_id', roomId)
        .neq('user_id', senderId);

      if (participantsError) {
        console.error('Error fetching chat participants:', participantsError);
        return;
      }

      if (!participants || participants.length === 0) {
        console.log('No participants found for chat notification');
        return;
      }

      // Get sender name
      const { data: sender } = await supabase
        .from('users')
        .select('name')
        .eq('id', senderId)
        .single();

      const senderName = sender?.name || 'Someone';
      
      // Get room name if not provided
      let chatRoomName = roomName;
      if (!chatRoomName) {
        const { data: room } = await supabase
          .from('chat_rooms')
          .select('name')
          .eq('id', roomId)
          .single();
        chatRoomName = room?.name || 'Chat';
      }

      // Send notification to each participant
      for (const participant of participants) {
        try {
          const { error: notificationError } = await supabase.functions.invoke('send-push-notification', {
            body: {
              user_id: participant.user_id,
              title: `New message in ${chatRoomName}`,
              content: `${senderName}: ${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}`,
              type: 'chat_message',
              send_push: true,
              metadata: {
                room_id: roomId,
                sender_id: senderId,
                sender_name: senderName,
                route: '/dashboard/chat',
                room_name: chatRoomName
              }
            }
          });

          if (notificationError) {
            console.error(`Error sending chat notification to ${participant.user_id}:`, notificationError);
          } else {
            console.log(`Chat notification sent to ${participant.user_id}`);
          }
        } catch (error) {
          console.error(`Failed to send chat notification to ${participant.user_id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in sendChatNotification:', error);
    }
  }, [user]);

  // Send chat invitation notification
  const sendChatInviteNotification = useCallback(async (
    userId: string,
    roomName: string,
    inviterName?: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: userId,
          title: 'New Chat Invitation',
          content: `${inviterName || 'Someone'} invited you to join "${roomName}"`,
          type: 'chat_invitation',
          send_push: true,
          metadata: {
            room_name: roomName,
            inviter_name: inviterName,
            route: '/dashboard/chat'
          }
        }
      });

      if (error) {
        console.error('Error sending chat invite notification:', error);
      } else {
        console.log('Chat invite notification sent successfully');
      }
    } catch (error) {
      console.error('Error in sendChatInviteNotification:', error);
    }
  }, [user]);

  return {
    sendChatNotification,
    sendChatInviteNotification,
  };
};