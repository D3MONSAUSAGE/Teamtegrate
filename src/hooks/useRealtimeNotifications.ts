
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { toast } from 'sonner';
import { playChatNotification, playAppSound } from '@/utils/chatSounds';

interface RealtimeNotification {
  id: string;
  title: string;
  content: string;
  type: string;
  user_id: string;
  created_at: string;
  metadata?: any;
}

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
        case 'schedule_assignment':
        case 'schedule_update':
          await playAppSound('status-change', soundSettings.volume);
          break;
        default:
          await playAppSound('success', soundSettings.volume);
      }
    } catch (error) {
      console.log('Sound playback failed (this is normal):', error);
    }
  }, []);

  const addVibrationAndHaptics = useCallback(async (notificationType: string) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      
      if (notificationType === 'chat_message') {
        await Haptics.vibrate({ duration: 200 });
      } else if (notificationType === 'task_assignment') {
        await Haptics.vibrate({ duration: 300 });
        setTimeout(() => Haptics.vibrate({ duration: 300 }), 400);
      }
    } catch (error) {
      console.log('Haptics not available:', error);
    }
  }, []);

  const showLocalNotification = useCallback(async (notification: RealtimeNotification) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const channelId = notification.type === 'chat_message' ? 'chat' : 
                       notification.type === 'task_assignment' ? 'tasks' : 'default';

      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: notification.title,
          body: notification.content,
          channelId,
          extra: notification.metadata || {},
        }]
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }, []);

  const handleRealtimeNotification = useCallback(async (notification: RealtimeNotification) => {
    console.log('Received realtime notification:', notification);
    
    // Play sound and vibration
    await playNotificationSoundEffect(notification.type);
    await addVibrationAndHaptics(notification.type);
    
    // Show toast for foreground notifications
    toast.info(notification.title, {
      description: notification.content,
      duration: 5000,
    });

    // Show local notification for consistency
    await showLocalNotification(notification);
  }, [playNotificationSoundEffect, addVibrationAndHaptics, showLocalNotification]);

  useEffect(() => {
    if (!user) return;

    console.log('🔔 Setting up realtime notifications for user:', user.id);

    // Subscribe to notifications table for real-time updates
    const notificationsChannel = supabase
      .channel(`user_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new as RealtimeNotification;
          handleRealtimeNotification(notification);
        }
      )
      .subscribe();

    // Subscribe to task changes that affect the user
    const tasksChannel = supabase
      .channel(`user_tasks_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to_id=eq.${user.id}`
        },
        (payload) => {
          const task = payload.new as any;
          const oldTask = payload.old as any;
          
          // Check if status changed
          if (task.status !== oldTask.status) {
            handleRealtimeNotification({
              id: `task_status_${task.id}`,
              title: 'Task Status Updated',
              content: `"${task.title}" status changed to ${task.status}`,
              type: 'task_status_change',
              user_id: user.id,
              created_at: new Date().toISOString(),
              metadata: { route: '/dashboard/tasks', task_id: task.id }
            });
          }
        }
      )
      .subscribe();

    // Subscribe to meeting requests for notifications
    const meetingChannel = supabase
      .channel(`user_meetings_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meeting_participants',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New meeting invitation received:', payload);
          // Meeting notifications are handled via the notifications table
        }
      )
      .subscribe();

    // Subscribe to chat messages in rooms where user is a participant
    const chatChannel = supabase
      .channel(`user_chat_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          const message = payload.new as any;
          
          // Check if user is participant in this room and not the sender
          if (message.user_id !== user.id) {
            const { data: isParticipant } = await supabase
              .from('chat_participants')
              .select('id')
              .eq('room_id', message.room_id)
              .eq('user_id', user.id)
              .single();

            if (isParticipant) {
              // Get sender name
              const { data: sender } = await supabase
                .from('users')
                .select('name')
                .eq('id', message.user_id)
                .single();

              handleRealtimeNotification({
                id: `chat_${message.id}`,
                title: 'New Message',
                content: `${sender?.name || 'Someone'}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
                type: 'chat_message',
                user_id: user.id,
                created_at: message.created_at,
                metadata: { route: '/dashboard/chat', room_id: message.room_id }
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 Cleaning up realtime notifications');
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(meetingChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [user, handleRealtimeNotification]);

  return {
    // Expose method to manually trigger notifications for testing
    triggerTestNotification: () => {
      if (user) {
        handleRealtimeNotification({
          id: 'test_notification',
          title: 'Test Notification',
          content: 'This is a test notification from the Supabase realtime system!',
          type: 'test',
          user_id: user.id,
          created_at: new Date().toISOString()
        });
      }
    }
  };
};
