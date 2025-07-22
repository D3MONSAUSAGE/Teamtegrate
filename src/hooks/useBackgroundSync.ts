
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Capacitor } from '@capacitor/core';

export const useBackgroundSync = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    // Store notifications that were missed while app was closed
    const syncMissedNotifications = async () => {
      try {
        const lastSyncTime = localStorage.getItem('lastNotificationSync');
        const since = lastSyncTime ? new Date(lastSyncTime) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

        const { data: missedNotifications } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('read', false)
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false });

        if (missedNotifications && missedNotifications.length > 0) {
          console.log(`Found ${missedNotifications.length} missed notifications`);
          
          // Update app badge with unread count
          if ('setAppBadge' in navigator) {
            (navigator as any).setAppBadge(missedNotifications.length);
          }
        }

        // Update last sync time
        localStorage.setItem('lastNotificationSync', new Date().toISOString());
      } catch (error) {
        console.error('Error syncing missed notifications:', error);
      }
    };

    // Sync when app becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncMissedNotifications();
      }
    };

    // Initial sync
    syncMissedNotifications();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);
};
