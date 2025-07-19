
import { useState, useEffect } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) return;

    const initializePushNotifications = async () => {
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Listen for registration
      PushNotifications.addListener('registration', async (token: Token) => {
        console.log('Push registration success, token: ' + token.value);
        setPushToken(token.value);
        
        // Store token in user profile
        await supabase
          .from('users')
          .update({ push_token: token.value })
          .eq('id', user.id);
        
        setIsRegistered(true);
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      // Listen for push notifications
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received: ', notification);
        
        // Show local toast for foreground notifications
        toast.info(notification.title || 'New Notification', {
          description: notification.body || '',
          duration: 5000,
        });
      });

      // Listen for notification actions
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push notification action performed', notification);
        
        // Handle deep linking based on notification data
        const data = notification.notification.data;
        if (data?.route) {
          // Navigate to specific route
          window.location.href = data.route;
        }
      });
    };

    initializePushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user]);

  const unregister = async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    await PushNotifications.removeAllListeners();
    setIsRegistered(false);
    setPushToken(null);
  };

  return {
    pushToken,
    isRegistered,
    unregister
  };
};
