import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Firebase web config - you'll need to add your config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

interface WebPushState {
  isSupported: boolean;
  isRegistered: boolean;
  permission: NotificationPermission;
  token: string | null;
  isRegistering: boolean;
  error: string | null;
}

export const useWebPushNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<WebPushState>({
    isSupported: false,
    isRegistered: false,
    permission: 'default',
    token: null,
    isRegistering: false,
    error: null
  });

  // Check if web push is supported
  const checkSupport = useCallback(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setState(prev => ({ ...prev, isSupported: supported }));
    return supported;
  }, []);

  // Register service worker and get push subscription
  const registerWebPush = useCallback(async () => {
    if (!checkSupport() || !user) return;

    setState(prev => ({ ...prev, isRegistering: true, error: null }));

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);

      // Initialize Firebase messaging (if available)
      let messaging;
      try {
        const { initializeApp } = await import('firebase/app');
        const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
        
        const app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);

        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: 'your-vapid-key' // You'll need to add your VAPID key
        });

        if (token) {
          // Store token in Supabase
          if (user.organizationId) {
            await supabase.from('fcm_tokens').upsert({
              user_id: user.id,
              organization_id: user.organizationId,
              token,
              platform: 'web',
              device_info: { browser: navigator.userAgent },
              is_active: true
            });
          }

          setState(prev => ({ 
            ...prev, 
            token, 
            isRegistered: true, 
            isRegistering: false 
          }));

          // Handle foreground messages
          onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            
            const title = payload.notification?.title || 'New Message';
            const body = payload.notification?.body || 'You have a new notification';
            
            // Show toast for foreground messages
            toast(title, { description: body });
            
            // Play notification sound if available
            try {
              const audio = new Audio('/notification-sound.mp3');
              audio.play().catch(e => console.log('Could not play sound:', e));
            } catch (e) {
              console.log('Audio not supported');
            }
          });

          console.log('Web push notifications registered successfully');
          return token;
        }
      } catch (firebaseError) {
        console.log('Firebase not available, using native web push');
        
        // Fallback to native web push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'your-vapid-public-key' // You'll need to add your public VAPID key
        });

        // Store subscription as FCM token (fallback)
        if (user.organizationId) {
          await supabase.from('fcm_tokens').upsert({
            user_id: user.id,
            organization_id: user.organizationId,
            token: 'web-push-' + Date.now(), // Unique identifier
            platform: 'web',
            device_info: { subscription: JSON.stringify(subscription) },
            is_active: true
          });
        }

        setState(prev => ({ 
          ...prev, 
          isRegistered: true, 
          isRegistering: false,
          token: 'web-push-subscription'
        }));
      }

    } catch (error) {
      console.error('Web push registration failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Registration failed',
        isRegistering: false 
      }));
      toast.error('Failed to enable notifications');
    }
  }, [user, checkSupport]);

  // Unregister web push
  const unregisterWebPush = useCallback(async () => {
    if (!user) return;

    try {
      // Remove from Supabase
      await supabase
        .from('fcm_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('platform', 'web');

      setState(prev => ({ 
        ...prev, 
        isRegistered: false, 
        token: null 
      }));
      
      toast.success('Notifications disabled');
    } catch (error) {
      console.error('Failed to unregister web push:', error);
    }
  }, [user]);

  // Test notification
  const testNotification = useCallback(async () => {
    if (!state.isRegistered || !user) return;

    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          title: 'Test Notification',
          content: 'This is a test notification from TeamTegrate!',
          type: 'test',
          send_push: true
        }
      });
      
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Test notification failed:', error);
      toast.error('Failed to send test notification');
    }
  }, [state.isRegistered, user]);

  // Initialize on mount
  useEffect(() => {
    checkSupport();
    
    // Check current permission status
    if ('Notification' in window) {
      setState(prev => ({ ...prev, permission: Notification.permission }));
    }
  }, [checkSupport]);

  // Auto-register if user is authenticated and supported
  useEffect(() => {
    if (user && state.isSupported && state.permission === 'default') {
      // Don't auto-register, let user choose
      console.log('Web push notifications available');
    }
  }, [user, state.isSupported, state.permission]);

  return {
    ...state,
    registerWebPush,
    unregisterWebPush,
    testNotification,
    checkSupport
  };
};