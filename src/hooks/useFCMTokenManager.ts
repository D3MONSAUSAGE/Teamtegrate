import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { Capacitor } from '@capacitor/core';

interface FCMTokenState {
  token: string | null;
  isRegistering: boolean;
  error: string | null;
}

export const useFCMTokenManager = () => {
  const { user } = useAuth();
  const [tokenState, setTokenState] = useState<FCMTokenState>({
    token: null,
    isRegistering: false,
    error: null
  });

  const registerFCMToken = useCallback(async (): Promise<string | null> => {
    if (!user) {
      console.log('❌ FCM token registration skipped: no user');
      return null;
    }

    // CRITICAL: Detect platform INSIDE the function, not at module level
    // This ensures Capacitor is fully ready before checking
    const isNativeApp = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    
    console.log('🚀 FCM Registration Started', { 
      hasUser: !!user, 
      userId: user?.id,
      isNative: isNativeApp,
      platform: platform,
      isPluginAvailable: Capacitor.isPluginAvailable('PushNotifications')
    });

    setTokenState(prev => ({ ...prev, isRegistering: true, error: null }));

    try {
      let currentToken: string;

      if (isNativeApp && platform === 'android') {
        console.log('📱 Android Native App - Using Native Token Bridge');
        
        // Request permission first
        const { PushNotifications } = await import('@capacitor/push-notifications');
        console.log('🔐 Requesting push notification permissions...');
        const permResult = await PushNotifications.requestPermissions();
        console.log('🔐 Permission result:', permResult);
        
        if (permResult.receive !== 'granted') {
          throw new Error('Push notification permission denied');
        }

        // Register with FCM (this triggers token generation in MyFirebaseMessagingService)
        console.log('📝 Registering with FCM...');
        await PushNotifications.register();
        console.log('✅ Registration completed');
        
        // Retry logic with exponential backoff to get token from native bridge
        const maxRetries = 5;
        const retryDelays = [1000, 2000, 3000, 5000, 8000]; // Exponential backoff
        let lastError: Error | null = null;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            console.log(`📝 Attempt ${attempt + 1}/${maxRetries}: Getting FCM token from native storage...`);
            
            // Wait before attempting (except first attempt)
            if (attempt > 0) {
              await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]));
            } else {
              // Small initial delay for first attempt
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // @ts-ignore - Custom plugin
            const result: any = await Capacitor.Plugins.FCMToken.getToken();
            
            if (result && result.success && result.token) {
              // Validate FCM token format (FCM tokens are typically 152+ characters)
              if (result.token.length < 100) {
                throw new Error('Invalid FCM token format (too short)');
              }
              
              currentToken = result.token;
              console.log('✅ FCM Token obtained from native bridge:', currentToken.substring(0, 30) + '...');
              break; // Success - exit retry loop
            } else {
              throw new Error(result?.error || 'No FCM token found in native storage');
            }
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.warn(`⚠️ Attempt ${attempt + 1} failed:`, lastError.message);
            
            if (attempt === maxRetries - 1) {
              // Last attempt failed
              throw new Error(`Failed to register for notifications after ${maxRetries} attempts. Please try again. Error: ${lastError.message}`);
            }
          }
        }
        
        if (!currentToken) {
          throw lastError || new Error('Failed to obtain FCM token after all retries');
        }
      } else {
        console.log('🌐 Web Path - Using Web Push');
        
        // Web fallback with service worker
        if (!('Notification' in window)) {
          throw new Error('Notifications not supported');
        }

        const permission = await Notification.requestPermission();
        console.log('🔐 Web notification permission:', permission);
        
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }

        // Register service worker for web push
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('✅ Service worker registered');
        
        // For web, generate a device-specific token
        currentToken = `web-${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('🌐 Web token generated:', currentToken.substring(0, 30) + '...');
      }

      // Store token in Supabase
      const detectedPlatform = isNativeApp ? platform : 'web';
      console.log('💾 Storing token in database...', {
        userId: user.id,
        platform: detectedPlatform,
        organizationId: user.organizationId,
        tokenPreview: currentToken.substring(0, 20) + '...'
      });

      const { data: insertData, error: dbError } = await supabase
        .from('fcm_tokens')
        .upsert({
          user_id: user.id,
          token: currentToken,
          platform: detectedPlatform,
          is_active: true,
          organization_id: user.organizationId
        }, {
          onConflict: 'user_id,token'
        })
        .select();

      if (dbError) {
        console.error('❌ Database error storing FCM token:', dbError);
        console.error('❌ Database error details:', {
          message: dbError.message,
          code: dbError.code,
          details: dbError.details,
          hint: dbError.hint
        });
        throw dbError;
      }

      console.log('✅ Token stored successfully in database:', insertData);

      setTokenState({
        token: currentToken,
        isRegistering: false,
        error: null
      });

      toast.success('Push notifications enabled!');
      console.log('🎉 FCM Registration Complete!');
      return currentToken;

    } catch (error) {
      console.error('❌ Error registering FCM token:', error);
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
    const isNative = Capacitor.isNativePlatform();
    console.log('🔄 FCM Manager useEffect triggered', { 
      hasUser: !!user, 
      userId: user?.id,
      isNative: isNative 
    });

    // Auto-register FCM token when user logs in
    if (user && typeof window !== 'undefined') {
      // For native apps, always try to register
      // For web, only if permission already granted
      if (isNative || (window.Notification && Notification.permission === 'granted')) {
        console.log('✅ Conditions met, calling registerFCMToken...');
        registerFCMToken();
      } else {
        console.log('⚠️ Conditions not met for auto-registration', {
          isNative: isNative,
          hasNotification: !!window.Notification,
          permission: window.Notification?.permission
        });
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
