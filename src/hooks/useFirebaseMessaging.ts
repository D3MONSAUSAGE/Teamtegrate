import { useEffect, useCallback, useRef } from 'react';
import { PushNotifications, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface FCMMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
  image?: string;
  icon?: string;
  tag?: string;
  click_action?: string;
  sound?: string;
}

export const useFirebaseMessaging = () => {
  const { user } = useAuth();
  const listenersRef = useRef<{
    registration?: any;
    registrationError?: any;
    notification?: any;
    action?: any;
  }>({});

  // Handle foreground notifications (app is open)
  const handleForegroundNotification = useCallback(async (notification: PushNotificationSchema) => {
    console.log('Foreground notification received:', notification);
    
    // Play sound and haptics
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      await Haptics.vibrate({ duration: 200 });
    } catch (error) {
      console.log('Haptics not available:', error);
    }

    // Show toast notification
    toast({
      title: notification.title || 'New Notification',
      description: notification.body || '',
      duration: 5000,
    });

    // Show local notification for native platforms
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [{
            id: Date.now(),
            title: notification.title || 'Notification',
            body: notification.body || '',
            extra: notification.data || {},
            sound: 'notification.wav',
            channelId: notification.data?.type === 'chat_message' ? 'chat' : 'default',
            actionTypeId: 'OPEN_APP',
            attachments: notification.data?.image ? [{ id: 'image', url: notification.data.image }] : undefined,
          }]
        });
      } catch (error) {
        console.error('Error scheduling local notification:', error);
      }
    }
  }, []);

  // Handle notification actions (when user taps notification)
  const handleNotificationAction = useCallback(async (action: ActionPerformed) => {
    console.log('Notification action performed:', action);
    
    const data = action.notification.data;
    
    // Navigate based on notification type
    if (data?.route) {
      window.location.href = data.route;
    } else if (data?.type === 'chat_message' && data?.room_id) {
      window.location.href = `/dashboard/chat?room=${data.room_id}`;
    } else if (data?.type === 'task_assignment' && data?.task_id) {
      window.location.href = `/dashboard/tasks?task=${data.task_id}`;
    } else {
      // Default to dashboard
      window.location.href = '/dashboard';
    }
  }, []);

  // Register for push notifications and get FCM token
  const registerForNotifications = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !user) return null;

    try {
      console.log('Registering for push notifications...');
      
      // Request permission
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive !== 'granted') {
        throw new Error('Push notification permission not granted');
      }

      // Register for push notifications
      await PushNotifications.register();
      
      console.log('Successfully registered for push notifications');
      return true;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return false;
    }
  }, [user]);

  // Test push notification functionality
  const testPushNotification = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          title: 'Test Push Notification',
          content: 'This is a test push notification from Firebase!',
          type: 'test',
          send_push: true,
          metadata: {
            test: true,
            timestamp: Date.now()
          }
        }
      });

      if (error) {
        console.error('Error sending test notification:', error);
        toast({
          title: 'Test Failed',
          description: 'Failed to send test notification',
          variant: 'destructive',
        });
      } else {
        console.log('Test notification sent:', data);
        toast({
          title: 'Test Sent',
          description: 'Test notification has been sent',
        });
      }
    } catch (error) {
      console.error('Error testing push notification:', error);
      toast({
        title: 'Test Error',
        description: 'Error occurred while testing notifications',
        variant: 'destructive',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupListeners = async () => {
      console.log('Setting up Firebase messaging listeners...');

      // Handle registration success
      listenersRef.current.registration = await PushNotifications.addListener('registration', (token) => {
        console.log('FCM registration token received:', token.value);
        
        // Store token in Supabase
        if (user && token.value) {
          supabase
            .from('fcm_tokens')
            .upsert({
              user_id: user.id,
              token: token.value,
              platform: Capacitor.getPlatform(),
              is_active: true,
              organization_id: user.organizationId || user.id,
            })
            .then(({ error }) => {
              if (error) {
                console.error('Error storing FCM token:', error);
              } else {
                console.log('FCM token stored successfully');
              }
            });
        }
      });

      // Handle registration errors
      listenersRef.current.registrationError = await PushNotifications.addListener('registrationError', (error) => {
        console.error('FCM registration error:', error);
      });

      // Handle foreground notifications
      listenersRef.current.notification = await PushNotifications.addListener('pushNotificationReceived', handleForegroundNotification);

      // Handle notification actions
      listenersRef.current.action = await PushNotifications.addListener('pushNotificationActionPerformed', handleNotificationAction);

      // Register for notifications
      registerForNotifications();
    };

    setupListeners();

    return () => {
      console.log('Cleaning up Firebase messaging listeners...');
      if (listenersRef.current.registration) {
        listenersRef.current.registration.remove();
      }
      if (listenersRef.current.registrationError) {
        listenersRef.current.registrationError.remove();
      }
      if (listenersRef.current.notification) {
        listenersRef.current.notification.remove();
      }
      if (listenersRef.current.action) {
        listenersRef.current.action.remove();
      }
    };
  }, [user, handleForegroundNotification, handleNotificationAction, registerForNotifications]);

  return {
    registerForNotifications,
    testPushNotification,
  };
};