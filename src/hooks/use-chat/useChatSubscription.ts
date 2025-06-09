
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
  const presenceChannelRef = useRef<any>(null);
  const messageChannelRef = useRef<any>(null);
  const soundSettings = useSoundSettings();

  useEffect(() => {
    if (!roomId || !userId) return;

    // Clean up existing subscriptions
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
    }
    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current);
    }

    // Initialize presence subscription for typing indicators
    presenceChannelRef.current = supabase
      .channel(`room:${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannelRef.current?.presenceState();
        const typingUsernames: string[] = [];
        
        if (newState) {
          Object.values(newState).forEach((presences: any) => {
            presences.forEach((presence: any) => {
              if (presence.isTyping && presence.user_id !== userId) {
                typingUsernames.push(presence.username);
              }
            });
          });
        }
        
        setTypingUsers(typingUsernames);
      })
      .subscribe();

    // Subscribe to new messages only (no updates/deletes to prevent loops)
    messageChannelRef.current = supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // Only handle messages from other users
          if (payload.new?.user_id !== userId) {
            console.log('New message received from other user');
            playChatNotification(soundSettings);
            
            // Add the new message
            setMessages(prev => {
              // Check if message already exists to prevent duplicates
              const messageExists = prev.some(msg => msg.id === payload.new.id);
              if (messageExists) return prev;
              return [...prev, payload.new];
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
        messageChannelRef.current = null;
      }
      
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = null;
      }
    };
  }, [roomId, userId]); // Minimal dependencies

  const sendTypingStatus = useCallback(() => {
    if (!userId || !presenceChannelRef.current) return;
    
    // Clear existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // Send typing status
    presenceChannelRef.current.track({
      user_id: userId,
      username: userId.substring(0, 6),
      isTyping: true
    });
    
    // Set timeout to clear typing status
    typingTimeout.current = setTimeout(() => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.track({
          user_id: userId,
          username: userId.substring(0, 6),
          isTyping: false
        });
      }
      typingTimeout.current = null;
    }, 3000);
  }, [userId]);

  return { sendTypingStatus, typingTimeout };
}
