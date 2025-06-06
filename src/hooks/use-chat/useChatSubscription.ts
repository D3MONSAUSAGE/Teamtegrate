
import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playChatNotification } from "@/utils/chatSounds";
import { useSoundSettings } from "@/hooks/useSoundSettings";

export function useChatSubscription(
  roomId: string,
  userId: string | undefined,
  setTypingUsers: React.Dispatch<React.SetStateAction<string[]>>,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
) {
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const soundSettings = useSoundSettings();

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
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // Only handle messages from other users to prevent duplicates
          if (payload.new?.user_id !== userId) {
            console.log('New message received, playing notification with settings:', soundSettings);
            playChatNotification(soundSettings);
            
            // Add the new message without duplicating existing ones
            setMessages(prev => {
              const messageExists = prev.some(msg => msg.id === payload.new.id);
              if (messageExists) return prev;
              return [...prev, payload.new];
            });
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
  }, [roomId, userId, setTypingUsers, setMessages, soundSettings.enabled, soundSettings.volume]);

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
