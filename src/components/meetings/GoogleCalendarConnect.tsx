import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

interface GoogleCalendarConnectProps {
  onConnectionChange?: (connected: boolean) => void;
}

const GoogleCalendarConnect: React.FC<GoogleCalendarConnectProps> = ({
  onConnectionChange,
}) => {
  const { isConnected, isLoading, connect, disconnect } = useGoogleCalendar();

  const handleConnect = async () => {
    await connect();
    onConnectionChange?.(true);
  };

  const handleDisconnect = async () => {
    await disconnect();
    onConnectionChange?.(false);
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
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
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
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
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