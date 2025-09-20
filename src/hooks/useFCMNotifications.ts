import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFCMTokenManager } from './useFCMTokenManager';
import { notifications } from '@/lib/notifications';
import { toast } from '@/components/ui/sonner';

/**
 * Enhanced notification hook that integrates Firebase Cloud Messaging
 * with existing Supabase realtime notifications
 */
export const useFCMNotifications = () => {
  const { user } = useAuth();
  const { registerFCMToken, testFCMNotification, isSupported } = useFCMTokenManager();

  // Send notification with FCM support
  const sendNotificationWithFCM = async (
    recipientIds: string[],
    title: string,
    content: string,
    type: string = 'info',
    metadata?: any,
    enablePush: boolean = true
  ) => {
    try {
      // Send to multiple recipients
      const results = await Promise.allSettled(
        recipientIds.map(async (recipientId) => {
          const { data, error } = await supabase.functions.invoke('send-push-notification', {
            body: {
              user_id: recipientId,
              title,
              content,
              type,
              metadata: metadata || {},
              send_push: enablePush && isSupported
            }
          });

          if (error) {
            console.error(`Failed to send notification to ${recipientId}:`, error);
            throw error;
          }

          return data;
        })
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      console.log(`Notifications sent: ${successful} successful, ${failed} failed`);
      return { successful, failed, total: recipientIds.length };
    } catch (error) {
      console.error('Error sending FCM notifications:', error);
      throw error;
    }
  };

  // Send single notification with FCM
  const sendSingleNotification = async (
    recipientId: string,
    title: string,
    content: string,
    type: string = 'info',
    metadata?: any,
    enablePush: boolean = true
  ) => {
    return sendNotificationWithFCM([recipientId], title, content, type, metadata, enablePush);
  };

  // Auto-register FCM token when user is authenticated
  useEffect(() => {
    if (user && isSupported) {
      // Auto-register FCM token on app start
      registerFCMToken().catch(error => {
        console.error('Auto FCM registration failed:', error);
      });
    }
  }, [user, isSupported, registerFCMToken]);

  return {
    sendNotificationWithFCM,
    sendSingleNotification,
    testFCMNotification,
    isSupported
  };
};