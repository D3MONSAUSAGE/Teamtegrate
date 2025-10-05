import { useNotificationChannels } from '@/hooks/useNotificationChannels';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';
import { useFCMTokenManager } from '@/hooks/useFCMTokenManager';
// Web push notifications removed - using FCM for all platforms
import { usePWAPrompt } from '@/hooks/usePWAPrompt';

// Simple web-only check instead of Capacitor import
const isNative = false; // Always false for web-only builds

/**
 * Headless component that initializes comprehensive notification functionality
 * including native notifications, FCM push notifications, web push notifications,
 * PWA support, haptics, background sync, and system dropdown notifications.
 * 
 * Provides unified cross-platform notification support:
 * - Native platforms: Capacitor + FCM
 * - Web browsers: Web Push + PWA + Service Worker
 * - iPhone Safari: PWA prompts + enhanced web notifications
 */
export function NotificationBootstrap() {
  // Initialize notification channels for Android (native only) - disabled for web
  // useNotificationChannels();
  
  // Initialize Firebase Cloud Messaging for push notifications
  useFirebaseMessaging();
  
  // Initialize FCM Token Manager - registers tokens on login
  useFCMTokenManager();
  
  // Initialize enhanced system notifications with dropdown support
  useSystemNotifications();
  
  // Initialize PWA installation prompts and detection
  usePWAPrompt();
  
  // Listen for real-time notifications and handle them
  useRealtimeNotifications();
  
  // Sync missed notifications when app becomes active
  useBackgroundSync();
  
  // This component renders nothing
  return null;
}

export default NotificationBootstrap;