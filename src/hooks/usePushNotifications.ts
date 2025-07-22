
import { useState, useEffect, useCallback } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed, PermissionStatus } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { playAppSound } from '@/utils/sounds';

interface NotificationAction {
  id: string;
  title: string;
  destructive?: boolean;
}

export const usePushNotifications = () => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus['receive']>('prompt');
  const { user } = useAuth();

  const initializeNotificationChannels = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Create notification channels for Android
      await LocalNotifications.createChannel({
        id: 'default',
        name: 'Default Notifications',
        description: 'General app notifications',
        importance: 5,
        sound: 'notification.wav',
        vibration: true,
        lights: true,
        lightColor: '#FF0000',
      });

      await LocalNotifications.createChannel({
        id: 'chat',
        name: 'Chat Messages',
        description: 'New chat messages',
        importance: 4,
        sound: 'chat-notification.mp3',
        vibration: true,
      });

      await LocalNotifications.createChannel({
        id: 'tasks',
        name: 'Task Updates',
        description: 'Task assignments and updates',
        importance: 4,
        sound: 'task-notification.mp3',
        vibration: true,
      });

      console.log('Notification channels created successfully');
    } catch (error) {
      console.error('Error creating notification channels:', error);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      // Request push notification permissions
      const permStatus = await PushNotifications.requestPermissions();
      setPermissionStatus(permStatus.receive);
      
      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission denied');
        toast.error('Push notifications are disabled. Enable them in your device settings for the best experience.');
        return false;
      }

      // Request local notification permissions
      await LocalNotifications.requestPermissions();
      
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }, []);

  const addVibrationAndHaptics = useCallback(async (notificationType: string) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Add haptic feedback
      await Haptics.impact({ style: ImpactStyle.Medium });
      
      // Custom vibration patterns based on notification type
      if (notificationType === 'chat_message') {
        // Short vibration for chat
        await Haptics.vibrate({ duration: 200 });
      } else if (notificationType === 'task_assignment') {
        // Double vibration for tasks
        await Haptics.vibrate({ duration: 300 });
        setTimeout(() => Haptics.vibrate({ duration: 300 }), 400);
      }
    } catch (error) {
      console.log('Haptics not available:', error);
    }
  }, []);

  const playNotificationSound = useCallback(async (notificationType: string) => {
    try {
      switch (notificationType) {
        case 'chat_message':
        case 'chat_invitation':
          await playAppSound('success', 0.7);
          break;
        case 'task_assignment':
          await playAppSound('status-change', 0.8);
          break;
        default:
          await playAppSound('success', 0.6);
      }
    } catch (error) {
      console.log('Sound playback failed:', error);
    }
  }, []);

  const handleDeepLink = useCallback((data: any) => {
    if (!data?.route) return;

    // Handle deep linking with a small delay to ensure app is ready
    setTimeout(() => {
      try {
        const route = data.route.startsWith('/') ? data.route : `/${data.route}`;
        window.location.href = route;
      } catch (error) {
        console.error('Deep link navigation failed:', error);
        // Fallback to default route
        window.location.href = '/dashboard';
      }
    }, 1000);
  }, []);

  const showLocalNotification = useCallback(async (notification: PushNotificationSchema) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const channelId = notification.data?.type === 'chat_message' ? 'chat' : 
                       notification.data?.type === 'task_assignment' ? 'tasks' : 'default';

      const actions: NotificationAction[] = [];
      
      // Add contextual actions based on notification type
      if (notification.data?.type === 'chat_message') {
        actions.push({ id: 'reply', title: 'Reply' });
        actions.push({ id: 'mark_read', title: 'Mark as Read' });
      } else if (notification.data?.type === 'task_assignment') {
        actions.push({ id: 'view_task', title: 'View Task' });
        actions.push({ id: 'accept', title: 'Accept' });
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: notification.title || 'TeamTegrate',
          body: notification.body || '',
          channelId,
          extra: notification.data,
          actionTypeId: actions.length > 0 ? 'default_actions' : undefined,
        }]
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) return;

    const initializePushNotifications = async () => {
      // Initialize notification channels first
      await initializeNotificationChannels();

      // Request permissions
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      try {
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
          toast.success('Push notifications enabled successfully!');
        });

        // Listen for registration errors
        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Error on registration: ' + JSON.stringify(error));
          toast.error('Failed to enable push notifications');
        });

        // Listen for push notifications received in foreground
        PushNotifications.addListener('pushNotificationReceived', async (notification: PushNotificationSchema) => {
          console.log('Push notification received: ', notification);
          
          // Play sound and vibration
          await playNotificationSound(notification.data?.type || 'default');
          await addVibrationAndHaptics(notification.data?.type || 'default');
          
          // Show local toast for foreground notifications
          toast.info(notification.title || 'New Notification', {
            description: notification.body || '',
            duration: 5000,
          });

          // Show local notification as well for consistency
          await showLocalNotification(notification);
        });

        // Listen for notification actions (when user taps notification)
        PushNotifications.addListener('pushNotificationActionPerformed', async (notification: ActionPerformed) => {
          console.log('Push notification action performed', notification);
          
          // Add haptic feedback for user interaction
          await addVibrationAndHaptics('default');
          
          // Handle deep linking
          handleDeepLink(notification.notification.data);
        });

        // Listen for local notification actions
        LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
          console.log('Local notification action performed', notification);
          
          // Handle specific actions
          if (notification.actionId === 'reply' && notification.notification.extra?.route) {
            handleDeepLink({ route: notification.notification.extra.route });
          } else if (notification.actionId === 'view_task') {
            handleDeepLink({ route: '/dashboard/tasks' });
          }
        });

      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
        toast.error('Failed to initialize push notifications');
      }
    };

    initializePushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
      LocalNotifications.removeAllListeners();
    };
  }, [user, initializeNotificationChannels, requestPermissions, playNotificationSound, addVibrationAndHaptics, showLocalNotification, handleDeepLink]);

  const unregister = async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await PushNotifications.removeAllListeners();
      await LocalNotifications.removeAllListeners();
      setIsRegistered(false);
      setPushToken(null);
      setPermissionStatus('prompt');
      
      // Clear token from user profile
      if (user) {
        await supabase
          .from('users')
          .update({ push_token: null })
          .eq('id', user.id);
      }
      
      toast.success('Push notifications disabled');
    } catch (error) {
      console.error('Error unregistering push notifications:', error);
      toast.error('Failed to disable push notifications');
    }
  };

  const testNotification = async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: 'Test Notification',
          body: 'This is a test notification from TeamTegrate!',
          channelId: 'default',
        }]
      });
      
      await playNotificationSound('default');
      await addVibrationAndHaptics('default');
      
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  return {
    pushToken,
    isRegistered,
    permissionStatus,
    unregister,
    testNotification,
    requestPermissions,
  };
};
