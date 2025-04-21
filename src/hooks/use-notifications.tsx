
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playSuccessSound } from '@/utils/sounds';

export interface Notification {
  id: string;
  type: 'chat_invitation' | 'message' | 'system';
  title: string;
  content: string;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (!user) return;

    // Initial fetch of notifications
    const fetchNotifications = async () => {
      try {
        // Check for chat room invitations (rooms where the user was recently added)
        const { data: participations, error } = await supabase
          .from('chat_room_participants')
          .select(`
            id,
            room_id,
            created_at,
            added_by,
            chat_rooms(name),
            users!users_id_fkey(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        if (participations && participations.length > 0) {
          const notifs = participations.map(p => ({
            id: p.id,
            type: 'chat_invitation' as const,
            title: 'Chat Invitation',
            content: `You were added to "${p.chat_rooms?.name}" chat room`,
            read: false,
            created_at: p.created_at
          }));
          
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.read).length);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    // Subscribe to chat room participant changes
    const channel = supabase
      .channel('public:chat_room_participants')
      .on('postgres_changes', 
        { 
          event: 'INSERT',
          schema: 'public',
          table: 'chat_room_participants',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          handleNewParticipation(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Handle new chat room participation
  const handleNewParticipation = async (participation: any) => {
    try {
      // Get room details
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('name')
        .eq('id', participation.room_id)
        .single();

      if (room) {
        const newNotification: Notification = {
          id: participation.id,
          type: 'chat_invitation',
          title: 'New Chat Invitation',
          content: `You were added to "${room.name}" chat room`,
          read: false,
          created_at: participation.created_at
        };

        // Add to notifications
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast and play sound
        toast.success(`You were added to "${room.name}" chat room`);
        playSuccessSound();
      }
    } catch (error) {
      console.error('Error processing new participation:', error);
    }
  };

  // Mark notifications as read
  const markAsRead = (id?: string) => {
    if (id) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } else {
      // Mark all as read
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead
  };
}
