import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { playChatNotification, playAppSound } from '@/utils/chatSounds';

interface RealtimeNotification {
  id: string;
  title: string;
  content: string;
  type: string;
  user_id: string;
  read: boolean;
  created_at: string;
}

// Web-only realtime notifications (no Capacitor dependency)
export const useRealtimeNotifications = () => {
  const { user } = useAuth();

  const playNotificationSoundEffect = useCallback(async (notificationType: string) => {
    const soundSettings = JSON.parse(localStorage.getItem('appSoundSettings') || '{"enabled":true,"volume":0.5}');
    
    if (!soundSettings.enabled) return;

    try {
      switch (notificationType) {
        case 'chat_message':
        case 'chat_invitation':
          await playChatNotification(soundSettings);
          break;
        case 'task_assignment':
        case 'task_status_change':
          await playAppSound('status-change', soundSettings.volume);
          break;
        default:
          await playAppSound('success', soundSettings.volume);
      }
    } catch (error) {
      console.log('Sound playback failed (this is normal):', error);
    }
  }, []);

  const handleRealtimeNotification = useCallback(async (notification: RealtimeNotification) => {
    console.log('Received realtime notification:', notification);
    
    // Play sound
    await playNotificationSoundEffect(notification.type);

    // Show web notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const webNotification = new Notification(notification.title, {
        body: notification.content,
        icon: '/favicon.ico'
      });
      
      // Auto-close after 5 seconds
      setTimeout(() => webNotification.close(), 5000);
    }

    // Show toast notification
    toast(notification.title, {
      description: notification.content,
      duration: 4000,
    });

    // Update badge count
    if ('setAppBadge' in navigator) {
      // Get unread count and update badge
      supabase
        .from('notifications')
        .select('count', { count: 'exact' })
        .eq('user_id', user?.id)
        .eq('read', false)
        .then(({ count }) => {
          if (count && count > 0) {
            (navigator as any).setAppBadge(count);
          }
        });
    }
  }, [user, playNotificationSoundEffect]);

  useEffect(() => {
    if (!user) return;

    console.log('🔔 Setting up realtime notifications for user:', user.id);

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as RealtimeNotification;
          handleRealtimeNotification(notification);
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 Cleaning up realtime notifications');
      supabase.removeChannel(channel);
    };
  }, [user, handleRealtimeNotification]);

  return {
    triggerTestNotification: () => {
      if (user) {
        handleRealtimeNotification({
          id: 'test_notification',
          title: 'Test Notification',
          content: 'This is a test notification from the web!',
          type: 'test',
          user_id: user.id,
          read: false,
          created_at: new Date().toISOString()
        });
      }
    }
  };
};