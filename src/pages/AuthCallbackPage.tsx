import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

type CallbackStatus = 'loading' | 'success' | 'error';

interface CallbackState {
  status: CallbackStatus;
  type?: 'email_change' | 'recovery' | 'invite' | 'signup' | 'magiclink';
  message: string;
  redirectPath?: string;
}

const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    message: 'Processing your request...'
  });

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash parameters from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type') || searchParams.get('type');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle errors from Supabase
        if (error) {
          setState({
            status: 'error',
            message: errorDescription || 'An error occurred during authentication',
            redirectPath: '/dashboard/settings'
          });
          
          toast.error(errorDescription || 'Authentication failed');
          
          // Auto-redirect after 5 seconds on error
          setTimeout(() => navigate('/dashboard/settings'), 5000);
          return;
        }

        // Exchange the auth code for a session
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setState({
            status: 'error',
            message: 'Failed to verify your session. Please try again.',
            redirectPath: '/dashboard/settings'
          });
          return;
        }

        // Determine callback type and handle accordingly
        switch (type) {
          case 'email_change':
            setState({
              status: 'success',
              type: 'email_change',
              message: 'Email successfully updated! Your new email address is now active.',
              redirectPath: '/dashboard/settings'
            });
            toast.success('Email address updated successfully!');
            break;

          case 'recovery':
            setState({
              status: 'success',
              type: 'recovery',
              message: 'Password reset verified! You can now set a new password.',
              redirectPath: '/dashboard/settings'
            });
            toast.success('Password reset link verified!');
            break;

          case 'invite':
            setState({
              status: 'success',
              type: 'invite',
              message: 'Email verified successfully! Welcome to the team.',
              redirectPath: '/dashboard'
            });
            toast.success('Email verified successfully!');
            break;

          case 'signup':
            setState({
              status: 'success',
              type: 'signup',
              message: 'Email verified successfully! Your account is now active.',
              redirectPath: '/dashboard'
            });
            toast.success('Account activated successfully!');
            break;

          case 'magiclink':
            setState({
              status: 'success',
              type: 'magiclink',
              message: 'Successfully logged in!',
              redirectPath: '/dashboard'
            });
            toast.success('Logged in successfully!');
            break;

          default:
            // Generic success for unknown types
            setState({
              status: 'success',
              message: 'Authentication successful!',
              redirectPath: '/dashboard'
            });
            toast.success('Authentication successful!');
        }

        // Auto-redirect after 3 seconds on success
        setTimeout(() => {
          const redirectPath = state.redirectPath || '/dashboard';
          navigate(redirectPath);
        }, 3000);

      } catch (error) {
        console.error('Auth callback error:', error);
        setState({
          status: 'error',
          message: 'An unexpected error occurred. Please try again.',
          redirectPath: '/dashboard/settings'
        });
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  const handleManualRedirect = () => {
    navigate(state.redirectPath || '/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-accent/10">
            {state.status === 'loading' && (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            )}
            {state.status === 'success' && (
              <CheckCircle className="h-8 w-8 text-green-500" />
            )}
            {state.status === 'error' && (
              <XCircle className="h-8 w-8 text-destructive" />
            )}
          </div>
          <CardTitle>
            {state.status === 'loading' && 'Processing...'}
            {state.status === 'success' && 'Success!'}
            {state.status === 'error' && 'Error'}
          </CardTitle>
          <CardDescription>
            {state.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.status === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                You will be redirected automatically in a few seconds...
              </p>
              <Button 
                onClick={handleManualRedirect} 
                className="w-full"
                variant="default"
              >
                Go Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
          
          {state.status === 'error' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                You will be redirected to settings in a few seconds...
              </p>
              <Button 
                onClick={handleManualRedirect} 
                className="w-full"
                variant="outline"
              >
                Go to Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {state.status === 'loading' && (
            <div className="flex justify-center">
              <div className="animate-pulse space-y-2 w-full">
                <div className="h-4 bg-accent/20 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-accent/20 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallbackPage;
