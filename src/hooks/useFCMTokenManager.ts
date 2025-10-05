import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

interface FCMTokenState {
  token: string | null;
  isRegistering: boolean;
  error: string | null;
}

// Use Capacitor Push Notifications when available (Android/iOS), fallback to web
const isNativeApp = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();

export const useFCMTokenManager = () => {
  const { user } = useAuth();
  const [tokenState, setTokenState] = useState<FCMTokenState>({
    token: null,
    isRegistering: false,
    error: null
  });

  const registerFCMToken = useCallback(async (): Promise<string | null> => {
    if (!user) {
      console.log('FCM token registration skipped: no user');
      return null;
    }

    setTokenState(prev => ({ ...prev, isRegistering: true, error: null }));

    try {
      let currentToken: string;

      if (isNativeApp) {
        // Use Capacitor Push Notifications for native apps
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        // Request permission
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') {
          throw new Error('Push notification permission denied');
        }

        // Register with FCM
        await PushNotifications.register();

        // Get registration token
        const result = await new Promise<string>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout waiting for FCM token')), 10000);
          
          PushNotifications.addListener('registration', (token) => {
            clearTimeout(timeout);
            resolve(token.value);
          });

          PushNotifications.addListener('registrationError', (error: any) => {
            clearTimeout(timeout);
            reject(error);
          });
        });

        currentToken = result;
        console.log('Native FCM Token obtained:', currentToken.substring(0, 20) + '...');
      } else {
        // Web fallback with service worker
        if (!('Notification' in window)) {
          throw new Error('Notifications not supported');
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }

        // Register service worker for web push
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        // For web, generate a device-specific token
        currentToken = `web-${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('Web token generated:', currentToken.substring(0, 20) + '...');
      }

      // Store token in Supabase
      const { error: dbError } = await supabase
        .from('fcm_tokens')
        .upsert({
          user_id: user.id,
          token: currentToken,
          platform: isNativeApp ? 'android' : 'web',
          is_active: true,
          organization_id: user.organizationId
        }, {
          onConflict: 'user_id,token'
        });

      if (dbError) {
        console.error('Error storing FCM token:', dbError);
        throw dbError;
      }

      setTokenState({
        token: currentToken,
        isRegistering: false,
        error: null
      });

      toast.success('Push notifications enabled!');
      return currentToken;

    } catch (error) {
      console.error('Error registering FCM token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to register for notifications';
      
      setTokenState({
        token: null,
        isRegistering: false,
        error: errorMessage
      });

      toast.error(errorMessage);
      return null;
    }
  }, [user]);

  const removeFCMToken = async (): Promise<boolean> => {
    try {
      if (tokenState.token && user) {
        // Deactivate token in database
        await supabase
          .from('fcm_tokens')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('token', tokenState.token);
      }

      setTokenState({
        token: null,
        isRegistering: false,
        error: null
      });

      toast.success('Notifications disabled');
      return true;
    } catch (error) {
      console.error('Error removing FCM token:', error);
      toast.error('Failed to disable notifications');
      return false;
    }
  };

  const getCurrentToken = async (): Promise<string | null> => {
    return tokenState.token;
  };

  const testFCMNotification = async (): Promise<boolean> => {
    if (!user) {
      toast('Please log in to test notifications');
      return false;
    }

    try {
      // Show test web notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Test Notification', {
          body: 'This is a test notification from TeamTegrate!',
          icon: '/favicon.ico'
        });
        
        toast('Test notification sent! Check your desktop.');
        return true;
      } else {
        toast('Notifications not enabled');
        return false;
      }
    } catch (error) {
      console.error('Error in test notification:', error);
      toast('Failed to send test notification');
      return false;
    }
  };

  useEffect(() => {
    // Auto-register FCM token when user logs in
    if (user && typeof window !== 'undefined') {
      // For native apps, always try to register
      // For web, only if permission already granted
      if (isNativeApp || (window.Notification && Notification.permission === 'granted')) {
        registerFCMToken();
      }
    }
  }, [user, registerFCMToken]);

  return {
    token: tokenState.token,
    isRegistering: tokenState.isRegistering,
    error: tokenState.error,
    registerFCMToken,
    removeFCMToken,
    getCurrentToken,
    testFCMNotification,
    isSupported: typeof window !== 'undefined' && 'Notification' in window
  };
};
