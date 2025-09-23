import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { playNotificationSound, playChatSound, playStatusChangeSound } from '@/utils/sounds';
import { useFCMTokenManager } from './useFCMTokenManager';

// Web-only push notifications (no Capacitor dependency)
export const usePushNotifications = () => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default'>('default');
  const { user } = useAuth();
  
  const { 
    token: fcmToken, 
    registerFCMToken, 
    removeFCMToken, 
    testFCMNotification,
    isSupported: fcmSupported,
    isRegistering: fcmRegistering,
    error: fcmError 
  } = useFCMTokenManager();

  const requestPermissions = useCallback(async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        
        if (permission !== 'granted') {
          console.log('Web notification permission denied');
          toast.error('Notifications are disabled. Enable them in your browser settings for the best experience.');
          return false;
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }, []);

  const playNotificationSoundEffect = useCallback(async (notificationType: string) => {
    try {
      switch (notificationType) {
        case 'chat_message':
        case 'chat_invitation':
          await playChatSound(0.7);
          break;
        case 'task_assignment':
          await playStatusChangeSound(0.8);
          break;
        default:
          await playNotificationSound(0.6);
      }
    } catch (error) {
      console.log('Sound playback failed:', error);
    }
  }, []);

  const showWebNotification = useCallback((title: string, body: string, data?: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        data
      });
      
      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
      
      // Handle click
      notification.onclick = () => {
        if (data?.route) {
          window.location.href = data.route;
        }
        notification.close();
      };
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const initializeWebNotifications = async () => {
      // Check notification permission
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
        
        if (Notification.permission === 'granted') {
          const webToken = `web-${user.id}-${Date.now()}`;
          setPushToken(webToken);
          setIsRegistered(true);
          
          // Register FCM token if supported
          if (fcmSupported) {
            try {
              await registerFCMToken();
            } catch (error) {
              console.error('FCM registration failed:', error);
            }
          }
        }
      }
    };

    initializeWebNotifications();
  }, [user, fcmSupported, registerFCMToken]);

  const unregister = async () => {
    try {
      // Remove FCM token first
      if (fcmSupported && fcmToken) {
        await removeFCMToken();
      }

      setIsRegistered(false);
      setPushToken(null);
      setPermissionStatus('default');
      
      toast.success('Notifications disabled');
    } catch (error) {
      console.error('Error unregistering notifications:', error);
      toast.error('Failed to disable notifications');
    }
  };

  const testNotification = async () => {
    try {
      // First try FCM test notification if supported
      if (fcmSupported && fcmToken) {
        const success = await testFCMNotification();
        if (success) {
          return; // FCM test was successful
        }
      }

      // Fallback to web notification
      showWebNotification(
        'Test Notification',
        'This is a test notification from TeamTegrate!',
        { test: true }
      );
      
      await playNotificationSound(0.6);
      
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  return {
    pushToken: fcmToken || pushToken,
    isRegistered: (fcmSupported && fcmToken) ? true : isRegistered,
    permissionStatus,
    unregister,
    testNotification,
    requestPermissions,
    showWebNotification,
    playNotificationSoundEffect,
    // FCM-specific properties
    fcmToken,
    fcmSupported,
    fcmRegistering,
    fcmError,
    registerFCMToken,
    removeFCMToken,
    testFCMNotification
  };
};