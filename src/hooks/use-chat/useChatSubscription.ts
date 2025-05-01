
import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playChatNotification } from "@/utils/chatSounds";

export function useChatSubscription(
  roomId: string,
  userId: string | undefined,
  setTypingUsers: React.Dispatch<React.SetStateAction<string[]>>,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
) {
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize subscription when component mounts
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const typingUsernames: string[] = [];
        
        Object.values(newState).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.isTyping && presence.user_id !== userId) {
              typingUsernames.push(presence.username);
            }
          });
        });
        
        setTypingUsers(typingUsernames);
      })
      .subscribe();

    // Subscribe to messages in this room
    const messageChannel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new?.user_id !== userId) {
            playChatNotification({ enabled: true, volume: 0.5 });
          }
          
          // Fetch latest messages - we'll use a callback here to fetch
          // No need to fetch all messages, just append the new one if it's an insert
          if (payload.eventType === "INSERT") {
            setMessages(prev => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(messageChannel);
      
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = null;
      }
    };
  }, [roomId, userId, setTypingUsers, setMessages]);

  const sendTypingStatus = useCallback(() => {
    if (!userId) return;
    
    // If a timeout exists, clear it
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // Send typing status through presence channel
    const channel = supabase.channel(`room:${roomId}`);
    channel.track({
      user_id: userId,
      username: userId.substring(0, 6), // Use a substring of user ID as temporary username
      isTyping: true
    });
    
    // Set a timeout to clear typing status
    typingTimeout.current = setTimeout(() => {
      channel.track({
        user_id: userId,
        username: userId.substring(0, 6),
        isTyping: false
      });
      typingTimeout.current = null;
    }, 3000);
  }, [roomId, userId]);

  return { sendTypingStatus, typingTimeout };
}
