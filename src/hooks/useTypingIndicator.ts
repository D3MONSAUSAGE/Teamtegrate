import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

interface UseTypingIndicatorProps {
  roomId: string | null;
  enabled?: boolean;
}

export function useTypingIndicator({ roomId, enabled = true }: UseTypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  const TYPING_TIMEOUT = 3000; // 3 seconds
  const TYPING_THROTTLE = 1000; // Send typing status max once per second

  // Start typing (debounced)
  const startTyping = useCallback(() => {
    if (!roomId || !user || !enabled) return;

    const now = Date.now();
    setIsTyping(true);

    // Throttle typing broadcasts
    if (now - lastTypingTimeRef.current < TYPING_THROTTLE) {
      return;
    }

    lastTypingTimeRef.current = now;

    // Send typing status via presence
    if (channelRef.current) {
      channelRef.current.track({
        user_id: user.id,
        user_name: user.name || user.email,
        typing: true,
        timestamp: now
      });
    }

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after timeout
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_TIMEOUT);
  }, [roomId, user, enabled]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!roomId || !user || !enabled) return;

    setIsTyping(false);

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Send stop typing status
    if (channelRef.current) {
      channelRef.current.track({
        user_id: user.id,
        user_name: user.name || user.email,
        typing: false,
        timestamp: Date.now()
      });
    }
  }, [roomId, user, enabled]);

  // Set up presence channel for typing indicators
  useEffect(() => {
    if (!roomId || !user || !enabled) {
      setTypingUsers([]);
      return;
    }

    const channel = supabase
      .channel(`typing_${roomId}`, {
        config: {
          presence: {
            key: user.id
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const currentTypingUsers: TypingUser[] = [];

        Object.entries(presenceState).forEach(([userId, presences]: [string, any[]]) => {
          const presence = presences[0];
          if (
            presence && 
            presence.typing && 
            userId !== user.id && // Don't show self
            Date.now() - presence.timestamp < TYPING_TIMEOUT
          ) {
            currentTypingUsers.push({
              id: userId,
              name: presence.user_name || 'User',
              timestamp: presence.timestamp
            });
          }
        });

        setTypingUsers(currentTypingUsers);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // Handle new users joining
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // Handle users leaving
        setTypingUsers(prev => 
          prev.filter(typingUser => 
            !leftPresences.some(p => p.user_id === typingUser.id)
          )
        );
      })
      .subscribe();

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [roomId, user, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping
  };
}