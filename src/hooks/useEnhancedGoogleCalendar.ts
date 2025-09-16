import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EnhancedGoogleCalendarHook {
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  importCalendar: () => Promise<void>;
  processSyncQueue: () => Promise<void>;
  checkConnection: () => Promise<void>;
  syncStats: {
    pending: number;
    success: number;
    failed: number;
  };
}

export const useEnhancedGoogleCalendar = (): EnhancedGoogleCalendarHook => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStats, setSyncStats] = useState({ pending: 0, success: 0, failed: 0 });

  useEffect(() => {
    if (user) {
      checkConnection();
      loadSyncStats();
      
      // Set up real-time sync status updates
      const subscription = supabase
        .channel('enhanced-sync-updates')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'calendar_sync_log',
            filter: `user_id=eq.${user.id}`
          }, 
          () => {
            loadSyncStats();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadSyncStats = async () => {
    if (!user) return;

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: logs, error } = await supabase
        .from('calendar_sync_log')
        .select('status')
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo);

      if (error) {
        console.error('Error loading sync stats:', error);
        return;
      }

      const stats = {
        pending: logs?.filter(log => log.status === 'pending').length || 0,
        success: logs?.filter(log => log.status === 'success').length || 0,
        failed: logs?.filter(log => log.status === 'failed').length || 0
      };

      setSyncStats(stats);
    } catch (error) {
      console.error('Error calculating sync stats:', error);
    }
  };

  const checkConnection = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('google_calendar_sync_enabled, google_refresh_token')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Failed to check Google connection:', error);
        setIsConnected(false);
      } else {
        const connected = data?.google_calendar_sync_enabled && data?.google_refresh_token;
        setIsConnected(!!connected);
      }
    } catch (error) {
      console.error('Error checking Google connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const connect = async () => {
    if (!user) {
      toast.error('Please sign in to connect Google Calendar');
      return;
    }

    setIsLoading(true);
    
    try {
      // Get Google config from edge function
      const { data: config, error: configError } = await supabase.functions.invoke('get-google-config');
      
      if (configError || !config?.clientId) {
        console.error('Failed to get Google config:', configError);
        toast.error('Google Calendar configuration not available. Please contact support.');
        setIsLoading(false);
        return;
      }
      
      // Generate Google OAuth URL with calendar scopes
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: `${window.location.origin}/auth/google/callback`,
        response_type: 'code',
        scope: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
        access_type: 'offline',
        prompt: 'consent',
        state: user.id,
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      // Open Google OAuth in new window
      const popup = window.open(
        authUrl,
        'google-calendar-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the authorization code
      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          const { code } = event.data;
          
          try {
            // Exchange code for tokens via edge function
            const { error } = await supabase.functions.invoke('google-calendar-auth', {
              body: { code, userId: user.id }
            });

            if (error) {
              console.error('Google Calendar auth error:', error);
              throw new Error(error.message || 'Failed to authenticate with Google Calendar');
            }

            toast.success('Google Calendar connected successfully!');
            setIsConnected(true);
            popup?.close();
            
            // Refresh connection status and trigger initial import
            await checkConnection();
            
            // Trigger initial import in the background
            setTimeout(() => {
              importCalendar();
            }, 1000);
            
          } catch (error) {
            console.error('Token exchange failed:', error);
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Failed to connect Google Calendar. Please try again.';
            toast.error(errorMessage);
          }
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          const errorMsg = event.data.error || 'Google Calendar connection cancelled';
          console.error('Google auth error:', errorMsg);
          toast.error(errorMsg);
        }
        
        window.removeEventListener('message', messageListener);
        setIsLoading(false);
      };

      window.addEventListener('message', messageListener);

      // Handle popup closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsLoading(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Failed to initiate Google Calendar connection:', error);
      toast.error('Failed to connect Google Calendar');
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (!user) return;

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          google_calendar_token: null,
          google_refresh_token: null,
          google_calendar_sync_enabled: false,
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Also disable sync preferences
      await supabase
        .from('google_calendar_sync_preferences')
        .update({
          sync_enabled: false,
          import_enabled: false,
          two_way_sync_enabled: false
        })
        .eq('user_id', user.id);

      toast.success('Google Calendar disconnected');
      setIsConnected(false);
      
    } catch (error) {
      console.error('Failed to disconnect Google Calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const importCalendar = async () => {
    if (!user || !isConnected) {
      toast.error('Google Calendar not connected');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('import-from-google-calendar', {
        body: { userId: user.id }
      });

      if (error) {
        throw error;
      }

      const { imported = 0, updated = 0, total = 0 } = data;
      
      if (imported === 0 && updated === 0) {
        toast.success('Calendar is up to date');
      } else {
        toast.success(`Import complete: ${imported} new meetings, ${updated} updated from ${total} events`);
      }
      
    } catch (error) {
      console.error('Failed to import calendar:', error);
      toast.error('Failed to import Google Calendar events');
    }
  };

  const processSyncQueue = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('process-calendar-sync-queue');

      if (error) {
        throw error;
      }

      const { processed = 0, errors = 0 } = data;
      
      if (processed === 0) {
        toast.success('No pending sync operations');
      } else {
        toast.success(`Processed ${processed} sync operations${errors > 0 ? `, ${errors} errors` : ''}`);
      }
      
    } catch (error) {
      console.error('Failed to process sync queue:', error);
      toast.error('Failed to process pending syncs');
    }
  };

  return {
    isConnected,
    isLoading,
    connect,
    disconnect,
    importCalendar,
    processSyncQueue,
    checkConnection,
    syncStats,
  };
};