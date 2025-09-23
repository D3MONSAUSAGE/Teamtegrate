import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Web-only system notifications (no Capacitor dependency)
export const useSystemNotifications = () => {
  const { user } = useAuth();

  const createNotificationChannels = useCallback(async () => {
    // Web notification setup
    if (!user || typeof window === 'undefined') return;
    
    try {
      // Request notification permission for web
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch (error) {
      console.error('Error creating notification channels:', error);
    }
  }, [user]);

  const scheduleSystemNotification = useCallback((options: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }) => {
    // Show web notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: '/favicon.ico',
        data: options.data
      });
      
      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    createNotificationChannels();
  }, [user, createNotificationChannels]);

  return {
    createNotificationChannels,
    scheduleSystemNotification,
  };
};