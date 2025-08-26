import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPresenceData {
  user_id: string;
  name: string;
  avatar_url?: string;
  online_at: string;
}

export interface UserPresence extends UserPresenceData {
  isOnline: boolean;
  lastSeenMinutesAgo?: number;
}

export const useUserPresence = (roomId?: string) => {
  const { user } = useAuth();
  const [presences, setPresences] = useState<Record<string, UserPresence>>({});
  const [isTracking, setIsTracking] = useState(false);

  // Convert presence data to UserPresence format
  const formatPresenceData = useCallback((data: any): UserPresence => {
    const now = new Date();
    const onlineAt = new Date(data.online_at || new Date().toISOString());
    const isOnline = (now.getTime() - onlineAt.getTime()) < 60000; // 1 minute threshold
    
    return {
      user_id: data.user_id || data.userId || 'unknown',
      name: data.name || 'Unknown User',
      avatar_url: data.avatar_url,
      online_at: data.online_at || new Date().toISOString(),
      isOnline,
      lastSeenMinutesAgo: isOnline ? 0 : Math.floor((now.getTime() - onlineAt.getTime()) / 60000)
    };
  }, []);

  // Start tracking presence
  const startTracking = useCallback(() => {
    if (!user || isTracking) return;

    setIsTracking(true);
    
    const channelName = roomId ? `room_${roomId}_presence` : 'global_presence';
    const channel = supabase.channel(channelName);

    const presenceData = {
      user_id: user.id,
      name: user.name || user.email || 'Unknown User',
      avatar_url: user.avatar_url,
      online_at: new Date().toISOString()
    };

    // Listen for presence changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const formattedPresences: Record<string, UserPresence> = {};
        
        Object.entries(state).forEach(([key, presenceList]) => {
          if (presenceList && presenceList.length > 0) {
            const latestPresence = presenceList[presenceList.length - 1];
            if (latestPresence && typeof latestPresence === 'object') {
              formattedPresences[key] = formatPresenceData(latestPresence);
            }
          }
        });
        
        setPresences(formattedPresences);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (newPresences && newPresences.length > 0) {
          const latestPresence = newPresences[newPresences.length - 1];
          if (latestPresence && typeof latestPresence === 'object') {
            setPresences(prev => ({
              ...prev,
              [key]: formatPresenceData(latestPresence)
            }));
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setPresences(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track(presenceData);
        
        // Set up periodic heartbeat
        const heartbeatInterval = setInterval(async () => {
          await channel.track({
            ...presenceData,
            online_at: new Date().toISOString()
          });
        }, 30000); // Every 30 seconds

        // Store cleanup function
        (channel as any).__cleanup = () => {
          clearInterval(heartbeatInterval);
          channel.untrack();
          supabase.removeChannel(channel);
          setIsTracking(false);
        };
      }
    });

    return () => {
      if ((channel as any).__cleanup) {
        (channel as any).__cleanup();
      }
    };
  }, [user, roomId, isTracking, formatPresenceData]);

  // Stop tracking presence
  const stopTracking = useCallback(() => {
    if (!isTracking) return;
    setIsTracking(false);
  }, [isTracking]);

  // Auto-start tracking when user is available
  useEffect(() => {
    if (user && !isTracking) {
      const cleanup = startTracking();
      return cleanup;
    }
  }, [user, startTracking, isTracking]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTracking();
      } else if (user && !isTracking) {
        startTracking();
      }
    };

    const handleBeforeUnload = () => {
      stopTracking();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, isTracking, startTracking, stopTracking]);

  // Get online users
  const onlineUsers = Object.values(presences).filter(p => p.isOnline);
  const offlineUsers = Object.values(presences).filter(p => !p.isOnline);
  
  // Get current user presence
  const currentUserPresence = user ? presences[user.id] : null;

  return {
    presences,
    onlineUsers,
    offlineUsers,
    currentUserPresence,
    isTracking,
    startTracking,
    stopTracking
  };
};