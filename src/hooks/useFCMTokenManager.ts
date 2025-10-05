import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

interface FCMTokenState {
  token: string | null;
  isRegistering: boolean;
  error: string | null;
}

// Web-only FCM token manager (no Capacitor dependency)
export const useFCMTokenManager = () => {
  const { user } = useAuth();
  const [tokenState, setTokenState] = useState<FCMTokenState>({
    token: null,
    isRegistering: false,
    error: null
  });

  const registerFCMToken = async (): Promise<string | null> => {
    if (!user) {
      console.log('FCM token registration skipped: no user');
      return null;
    }

    setTokenState(prev => ({ ...prev, isRegistering: true, error: null }));

    try {
      // Web notification setup
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Generate a mock token for web
          const webToken = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          setTokenState({
            token: webToken,
            isRegistering: false,
            error: null
          });

          toast('Web notifications enabled!');
          return webToken;
        } else {
          throw new Error('Notification permission denied');
        }
      } else {
        throw new Error('Notifications not supported');
      }
    } catch (error) {
      console.error('Error registering FCM token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to register for notifications';
      
      setTokenState({
        token: null,
        isRegistering: false,
        error: errorMessage
      });

      toast(errorMessage);
      return null;
    }
  };

  const removeFCMToken = async (): Promise<boolean> => {
    try {
      setTokenState({
        token: null,
        isRegistering: false,
        error: null
      });

      toast('Notifications disabled');
      return true;
    } catch (error) {
      console.error('Error removing FCM token:', error);
      toast('Failed to disable notifications');
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
    // Web notification support check
    if (user && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const webToken = `web-${Date.now()}-${user.id}`;
        setTokenState(prev => ({ ...prev, token: webToken }));
      }
    }
  }, [user]);

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
