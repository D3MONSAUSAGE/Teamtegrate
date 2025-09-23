import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface FCMMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Web-only Firebase messaging (no Capacitor dependency)
export const useFirebaseMessaging = () => {
  const { user } = useAuth();

  const handleNotificationReceived = useCallback((message: FCMMessage) => {
    // Show web notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(message.title, {
        body: message.body,
        icon: '/favicon.ico'
      });
      
      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }

    // Show toast as fallback
    toast({
      title: message.title,
      description: message.body,
    });
  }, []);

  const handleNotificationClicked = useCallback((data?: Record<string, string>) => {
    console.log('Notification clicked with data:', data);
    
    // Handle navigation based on notification data
    if (data?.route) {
      window.location.href = data.route;
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Web notification setup
    const setupWebNotifications = async () => {
      try {
        // Request permission
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch (error) {
        console.error('Error setting up web notifications:', error);
      }
    };

    setupWebNotifications();
  }, [user]);

  return {
    handleNotificationReceived,
    handleNotificationClicked,
    testPushNotification: () => console.log('Test push notification (web-only)'),
  };
};