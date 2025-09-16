import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoogleCalendarConnectProps {
  isConnected?: boolean;
  onConnectionChange?: (connected: boolean) => void;
}

const GoogleCalendarConnect: React.FC<GoogleCalendarConnectProps> = ({
  isConnected = false,
  onConnectionChange,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { user } = useAuth();

  const handleConnect = async () => {
    if (!user) {
      toast.error('Please sign in to connect Google Calendar');
      return;
    }

    setIsConnecting(true);
    
    try {
      // Fetch Google client configuration
      const { data: config, error: configError } = await supabase.functions.invoke('get-google-config');
      
      if (configError) {
        console.error('Failed to get Google config:', configError);
        toast.error('Failed to get Google configuration');
        setIsConnecting(false);
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
              throw error;
            }

            toast.success('Google Calendar connected successfully!');
            onConnectionChange?.(true);
            popup?.close();
            
          } catch (error) {
            console.error('Token exchange failed:', error);
            toast.error('Failed to connect Google Calendar');
          }
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          toast.error('Google Calendar connection cancelled');
        }
        
        window.removeEventListener('message', messageListener);
        setIsConnecting(false);
      };

      window.addEventListener('message', messageListener);

      // Handle popup closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Failed to initiate Google Calendar connection:', error);
      toast.error('Failed to connect Google Calendar');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    setIsDisconnecting(true);
    
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
      onConnectionChange?.(false);
      
    } catch (error) {
      console.error('Failed to disconnect Google Calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Google Calendar Integration</CardTitle>
            {isConnected && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          {isConnected 
            ? "Your meetings will automatically sync with Google Calendar"
            : "Connect your Google Calendar to sync meetings automatically"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500" />
              <p>
                Connecting Google Calendar will allow you to:
              </p>
            </div>
            <ul className="text-sm text-muted-foreground ml-6 space-y-1">
              <li>• Automatically create Google Calendar events for meetings</li>
              <li>• Generate Google Meet links for video calls</li>
              <li>• Send calendar invitations to participants</li>
              <li>• Keep your schedules synchronized</li>
            </ul>
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Connect Google Calendar
                </div>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4 mt-0.5" />
              <p>
                Google Calendar is connected and ready to sync your meetings.
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="w-full"
            >
              {isDisconnecting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Disconnecting...
                </div>
              ) : (
                'Disconnect Google Calendar'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarConnect;