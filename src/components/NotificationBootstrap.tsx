import { useNotificationChannels } from '@/hooks/useNotificationChannels';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';

/**
 * Headless component that initializes comprehensive notification functionality
 * including native notifications, FCM push notifications, haptics, background sync,
 * and system dropdown notifications on mobile platforms.
 */
export function NotificationBootstrap() {
  // Initialize notification channels for Android
  useNotificationChannels();
  
  // Initialize Firebase Cloud Messaging for push notifications
  useFirebaseMessaging();
  
  // Initialize enhanced system notifications with dropdown support
  useSystemNotifications();
  
  // Listen for real-time notifications and handle them
  useRealtimeNotifications();
  
  // Sync missed notifications when app becomes active
  useBackgroundSync();
  
  // This component renders nothing
  return null;
}

export default NotificationBootstrap;