import { useNotificationChannels } from '@/hooks/useNotificationChannels';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';

/**
 * Headless component that initializes notification functionality
 * without any visible UI. Enables native notifications, haptics,
 * and background sync on mobile platforms.
 */
export function NotificationBootstrap() {
  // Initialize notification channels for Android
  useNotificationChannels();
  
  // Listen for real-time notifications and handle them
  useRealtimeNotifications();
  
  // Sync missed notifications when app becomes active
  useBackgroundSync();
  
  // This component renders nothing
  return null;
}

export default NotificationBootstrap;