import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        // Get all rooms user participates in
        const { data: participantRooms } = await supabase
          .from('chat_participants')
          .select('room_id')
          .eq('user_id', user.id);

        if (!participantRooms?.length) {
          setUnreadCount(0);
          return;
        }

        const roomIds = participantRooms.map(p => p.room_id);

        // Count unread messages (messages created after user's last seen timestamp)
        // For now, we'll use a simple count of messages in the last hour as a proxy
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const { data: recentMessages } = await supabase
          .from('chat_messages')
          .select('id')
          .in('room_id', roomIds)
          .neq('user_id', user.id) // Don't count user's own messages
          .gte('created_at', oneHourAgo)
          .is('deleted_at', null);

        setUnreadCount(recentMessages?.length || 0);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('unread_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        // If it's not the current user's message, increment unread count
        if (payload.new.user_id !== user.id) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return { unreadCount, markAsRead };
}