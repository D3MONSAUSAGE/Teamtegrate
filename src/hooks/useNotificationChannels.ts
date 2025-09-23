import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Web-only notification channels (no Capacitor dependency)
export const useNotificationChannels = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    // Web notification permissions and setup
    if (!user || typeof window === 'undefined') return;
    
    const setupWebNotifications = async () => {
      try {
        // Request notification permission for web
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch (error) {
        console.error('Error setting up web notifications:', error);
      }
    };
    
    setupWebNotifications();
  }, [user]);
};