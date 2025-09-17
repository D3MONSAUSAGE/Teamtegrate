import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const GoogleCalendarCallback: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log('🔄 Google Calendar callback processing...');
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // This contains the user ID

    console.log('📥 Callback parameters:', { 
      hasCode: !!code, 
      hasError: !!error, 
      hasState: !!state,
      code: code?.substring(0, 10) + '...', 
      error,
      state 
    });

    if (error) {
      console.error('❌ OAuth error received:', error);
      // Send error message to parent window
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error,
      }, window.location.origin);
      console.log('📤 Sent error message to parent window, closing...');
      window.close();
      return;
    }

    if (code && state) {
      console.log('✅ Sending success message to parent window');
      // Send success message with code to parent window
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        code,
        userId: state,
      }, window.location.origin);
      console.log('📤 Sent success message to parent window, closing...');
      window.close();
      return;
    }

    // If no code or error, something went wrong
    console.error('⚠️ No code or error received - invalid callback');
    window.opener?.postMessage({
      type: 'GOOGLE_AUTH_ERROR',
      error: 'Missing authorization code',
    }, window.location.origin);
    console.log('📤 Sent missing code error to parent window, closing...');
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