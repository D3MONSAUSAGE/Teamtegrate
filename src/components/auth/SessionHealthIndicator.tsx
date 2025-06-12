
import React from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import { useAuth } from '@/contexts/AuthContext';

const SessionHealthIndicator: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { isSessionHealthy, isChecking, checkAndRecoverSession } = useSessionGuard({
    onSessionLost: () => {
      console.log('Session lost, user may need to re-authenticate');
    },
    onSessionRecovered: () => {
      console.log('Session recovered successfully');
    }
  });

  if (!isAuthenticated) {
    return null;
  }

  if (isSessionHealthy === true) {
    return null; // Don't show anything when session is healthy
  }

  if (isSessionHealthy === false) {
    return (
      <Alert className="mb-4 border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-yellow-800">
            Session sync issue detected. Your data may not load properly.
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkAndRecoverSession}
              disabled={isChecking}
              className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Fixing...
                </>
              ) : (
                'Fix Session'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
            >
              Re-login
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default SessionHealthIndicator;
