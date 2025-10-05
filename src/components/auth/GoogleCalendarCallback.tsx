import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const GoogleCalendarCallback: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // This contains the user ID

    if (error) {
      console.error('OAuth error received:', error);
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error,
      }, window.location.origin);
      window.close();
      return;
    }

    if (code && state) {
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        code,
        userId: state,
      }, window.location.origin);
      window.close();
      return;
    }

    console.error('No code or error received - invalid callback');
    window.opener?.postMessage({
      type: 'GOOGLE_AUTH_ERROR',
      error: 'Missing authorization code',
    }, window.location.origin);
    window.close();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Connecting Google Calendar
          </CardTitle>
          <CardDescription>
            Please wait while we complete the connection...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            This window will close automatically when done.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCalendarCallback;