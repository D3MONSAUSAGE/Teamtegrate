import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GoogleCalendarHook {
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  syncMeeting: (meetingId: string, action?: 'create' | 'update' | 'delete') => Promise<void>;
  syncTask: (taskId: string, action?: 'create' | 'update' | 'delete', syncType?: 'deadline' | 'focus_time' | 'reminder') => Promise<void>;
  checkConnection: () => Promise<void>;
}

export const useGoogleCalendar = (): GoogleCalendarHook => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user]);

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
      
      // Generate Google OAuth URL with minimal required scopes
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: `${window.location.origin}/auth/google/callback`,
        response_type: 'code',
        scope: 'openid email profile https://www.googleapis.com/auth/calendar',
        access_type: 'offline',
        prompt: 'consent',
        state: user.id, // Pass user ID as state parameter
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
            
            // Refresh connection status
            await checkConnection();
            
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

      toast.success('Google Calendar disconnected');
      setIsConnected(false);
      
    } catch (error) {
      console.error('Failed to disconnect Google Calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const syncMeeting = async (meetingId: string, action: 'create' | 'update' | 'delete' = 'create') => {
    if (!user || !isConnected) {
      toast.error('Google Calendar not connected');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('sync-meeting-to-google', {
        body: { meetingId, action }
      });

      if (error) {
        throw error;
      }

      const actionText = action === 'delete' ? 'removed from' : `${action}d in`;
      toast.success(`Meeting ${actionText} Google Calendar`);
      
    } catch (error) {
      console.error('Failed to sync meeting:', error);
      toast.error(`Failed to ${action} meeting in Google Calendar`);
    }
  };

  const syncTask = async (taskId: string, action: 'create' | 'update' | 'delete' = 'create', syncType: 'deadline' | 'focus_time' | 'reminder' = 'deadline') => {
    if (!user || !isConnected) {
      toast.error('Google Calendar not connected');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('sync-tasks-to-google', {
        body: { taskId, action, syncType }
      });

      if (error) {
        throw error;
      }

      const actionText = action === 'delete' ? 'removed from' : `${action}d in`;
      toast.success(`Task ${actionText} Google Calendar`);
      
    } catch (error) {
      console.error('Failed to sync task:', error);
      toast.error(`Failed to ${action} task in Google Calendar`);
    }
  };

  return {
    isConnected,
    isLoading,
    connect,
    disconnect,
    syncMeeting,
    syncTask,
    checkConnection,
  };
};