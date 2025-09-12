import { useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';

export const useSystemNotifications = () => {
  const { user } = useAuth();

  // Create enhanced notification channels for system notifications
  const createNotificationChannels = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Chat messages channel with high priority
      await LocalNotifications.createChannel({
        id: 'chat_messages',
        name: 'Chat Messages',
        description: 'Notifications for new chat messages',
        importance: 5, // IMPORTANCE_HIGH
        sound: 'chat-notification.mp3',
        vibration: true,
        lights: true,
        lightColor: '#0084ff',
        visibility: 1, // VISIBILITY_PUBLIC
      });

      // Tasks channel with normal priority
      await LocalNotifications.createChannel({
        id: 'tasks',
        name: 'Task Updates',
        description: 'Task assignments and updates',
        importance: 4, // IMPORTANCE_DEFAULT
        sound: 'task-notification.mp3',
        vibration: true,
        lights: true,
        lightColor: '#ff9500',
      });

      // Meetings channel with high priority
      await LocalNotifications.createChannel({
        id: 'meetings',
        name: 'Meetings',
        description: 'Meeting invitations and updates',
        importance: 5, // IMPORTANCE_HIGH
        sound: 'meeting-notification.mp3',
        vibration: true,
        lights: true,
        lightColor: '#34c759',
      });

      // General notifications
      await LocalNotifications.createChannel({
        id: 'general',
        name: 'General Notifications',
        description: 'General app notifications',
        importance: 4, // IMPORTANCE_DEFAULT
        sound: 'notification.mp3',
        vibration: true,
        lights: true,
        lightColor: '#6366f1',
      });

      // System alerts with max priority
      await LocalNotifications.createChannel({
        id: 'alerts',
        name: 'System Alerts',
        description: 'Important system notifications',
        importance: 5, // IMPORTANCE_HIGH
        sound: 'alert.mp3',
        vibration: true,
        lights: true,
        lightColor: '#ff3b30',
      });

      console.log('Enhanced notification channels created successfully');
    } catch (error) {
      console.error('Error creating notification channels:', error);
    }
  }, []);

  // Schedule a rich system notification
  const scheduleSystemNotification = useCallback(async (options: {
    id?: number;
    title: string;
    body: string;
    channelId?: string;
    largeIcon?: string;
    smallIcon?: string;
    iconColor?: string;
    attachments?: Array<{ id: string; url: string; options?: any }>;
    actionTypeId?: string;
    extra?: any;
    schedule?: { at?: Date };
    sound?: string;
    group?: string;
    groupSummary?: boolean;
    ongoing?: boolean;
    autoCancel?: boolean;
  }) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const notification = {
        id: options.id || Date.now(),
        title: options.title,
        body: options.body,
        channelId: options.channelId || 'general',
        largeIcon: options.largeIcon,
        smallIcon: options.smallIcon || 'ic_stat_notification',
        iconColor: options.iconColor || '#6366f1',
        attachments: options.attachments,
        actionTypeId: options.actionTypeId || 'OPEN_APP',
        extra: options.extra || {},
        schedule: options.schedule,
        sound: options.sound,
        group: options.group,
        groupSummary: options.groupSummary || false,
        ongoing: options.ongoing || false,
        autoCancel: options.autoCancel !== false,
      };

      await LocalNotifications.schedule({
        notifications: [notification]
      });

      console.log('System notification scheduled:', notification.id);
    } catch (error) {
      console.error('Error scheduling system notification:', error);
    }
  }, []);

  // Handle notification actions
  const handleNotificationAction = useCallback(async (action: any) => {
    console.log('System notification action:', action);
    
    const data = action.notification?.extra || {};
    
    // Navigate based on action type
    if (data.route) {
      window.location.href = data.route;
    } else if (action.actionId === 'REPLY' && data.room_id) {
      // Handle quick reply for chat messages
      window.location.href = `/dashboard/chat?room=${data.room_id}`;
    } else if (action.actionId === 'MARK_READ') {
      // Mark notification as read
      console.log('Marking notification as read');
    } else {
      // Default action - open the app
      window.location.href = '/dashboard';
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) return;

    // Create notification channels on initialization
    createNotificationChannels();

    // Listen for notification actions
    const setupActionListener = async () => {
      const handle = await LocalNotifications.addListener('localNotificationActionPerformed', handleNotificationAction);
      return handle;
    };
    
    let actionListenerHandle: any;
    setupActionListener().then(handle => {
      actionListenerHandle = handle;
    });

    return () => {
      if (actionListenerHandle) {
        actionListenerHandle.remove();
      }
    };
  }, [user, createNotificationChannels, handleNotificationAction]);

  return {
    createNotificationChannels,
    scheduleSystemNotification,
  };
};