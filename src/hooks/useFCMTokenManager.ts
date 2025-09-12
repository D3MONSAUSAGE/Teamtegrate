import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

interface FCMTokenState {
  token: string | null;
  isRegistering: boolean;
  error: string | null;
}

/**
 * Hook to manage Firebase Cloud Messaging tokens
 * Handles registration, storage, and updates of FCM tokens
 */
export const useFCMTokenManager = () => {
  const { user } = useAuth();
  const [tokenState, setTokenState] = useState<FCMTokenState>({
    token: null,
    isRegistering: false,
    error: null
  });

  // Register FCM token
  const registerFCMToken = async (): Promise<string | null> => {
    if (!Capacitor.isNativePlatform() || !user) {
      console.log('FCM token registration skipped: not native platform or no user');
      return null;
    }

    setTokenState(prev => ({ ...prev, isRegistering: true, error: null }));

    try {
      // Check permission status
      const permissionStatus = await PushNotifications.checkPermissions();
      
      if (permissionStatus.receive !== 'granted') {
        const requestResult = await PushNotifications.requestPermissions();
        if (requestResult.receive !== 'granted') {
          throw new Error('Push notification permission not granted');
        }
      }

      // Register with FCM
      await PushNotifications.register();

      // Get device info
      const deviceInfo = await Device.getInfo();
      
      // Wait for registration token
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('FCM token registration timeout'));
        }, 10000); // 10 second timeout

        PushNotifications.addListener('registration', async (token) => {
          clearTimeout(timeout);
          
          try {
            // Store token in Supabase
            const { data, error } = await supabase.rpc('register_fcm_token', {
              p_token: token.value,
              p_platform: deviceInfo.platform,
              p_device_info: {
                model: deviceInfo.model,
                platform: deviceInfo.platform,
                operatingSystem: deviceInfo.operatingSystem,
                osVersion: deviceInfo.osVersion,
                manufacturer: deviceInfo.manufacturer,
                isVirtual: deviceInfo.isVirtual
              }
            });

            if (error) {
              console.error('Error storing FCM token:', error);
              throw error;
            }

            console.log('FCM token registered successfully:', data);
            
            setTokenState({
              token: token.value,
              isRegistering: false,
              error: null
            });

            toast.success('Push notifications enabled successfully!');
            resolve(token.value);
          } catch (err) {
            console.error('Error in FCM token registration:', err);
            setTokenState({
              token: null,
              isRegistering: false,
              error: err instanceof Error ? err.message : 'Unknown error'
            });
            reject(err);
          }
        });

        PushNotifications.addListener('registrationError', (error) => {
          clearTimeout(timeout);
          console.error('FCM registration error:', error);
          setTokenState({
            token: null,
            isRegistering: false,
            error: error.error
          });
          reject(new Error(error.error));
        });
      });
    } catch (error) {
      console.error('Error registering FCM token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to register for push notifications';
      
      setTokenState({
        token: null,
        isRegistering: false,
        error: errorMessage
      });

      toast.error(errorMessage);
      return null;
    }
  };

  // Remove FCM token
  const removeFCMToken = async (): Promise<boolean> => {
    if (!tokenState.token) return true;

    try {
      const { error } = await supabase
        .from('fcm_tokens')
        .update({ is_active: false })
        .eq('token', tokenState.token)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deactivating FCM token:', error);
        return false;
      }

      setTokenState({
        token: null,
        isRegistering: false,
        error: null
      });

      toast.success('Push notifications disabled');
      return true;
    } catch (error) {
      console.error('Error removing FCM token:', error);
      toast.error('Failed to disable push notifications');
      return false;
    }
  };

  // Get current token from storage
  const getCurrentToken = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('fcm_tokens')
        .select('token, platform')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching FCM token:', error);
        return null;
      }

      if (data) {
        setTokenState(prev => ({ ...prev, token: data.token }));
        return data.token;
      }

      return null;
    } catch (error) {
      console.error('Error getting current FCM token:', error);
      return null;
    }
  };

  // Test FCM notification
  const testFCMNotification = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to test notifications');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          title: 'Test Notification',
          content: 'This is a test push notification from TeamTegrate!',
          type: 'test',
          send_push: true,
          metadata: {
            test: true,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('Error testing FCM notification:', error);
        toast.error('Failed to send test notification');
        return false;
      }

      console.log('Test notification sent:', data);
      toast.success('Test notification sent! Check your device.');
      return true;
    } catch (error) {
      console.error('Error in test notification:', error);
      toast.error('Failed to send test notification');
      return false;
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (user && Capacitor.isNativePlatform()) {
      getCurrentToken();
    }
  }, [user]);

  // Set up push notification listeners
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupListeners = () => {
      // Handle notification received while app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received in foreground:', notification);
        toast.info(notification.title || 'New notification', {
          description: notification.body
        });
      });

      // Handle notification action (user tapped notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed:', notification);
        // Handle navigation based on notification data
        const data = notification.notification.data;
        if (data?.type) {
          // You can add navigation logic here based on notification type
          console.log('Notification type:', data.type);
        }
      });
    };

    setupListeners();
  }, []);

  return {
    token: tokenState.token,
    isRegistering: tokenState.isRegistering,
    error: tokenState.error,
    registerFCMToken,
    removeFCMToken,
    getCurrentToken,
    testFCMNotification,
    isSupported: Capacitor.isNativePlatform()
  };
};