
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkSessionHealth, recoverSession } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface SessionGuardOptions {
  requireAuth?: boolean;
  onSessionLost?: () => void;
  onSessionRecovered?: () => void;
}

export const useSessionGuard = (options: SessionGuardOptions = {}) => {
  const { user, isAuthenticated, refreshUserSession } = useAuth();
  const [isSessionHealthy, setIsSessionHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkAndRecoverSession = async () => {
    if (!isAuthenticated || !user) {
      setIsSessionHealthy(null);
      return false;
    }

    setIsChecking(true);
    
    try {
      console.log('🔍 SessionGuard: Checking session health...');
      const healthCheck = await checkSessionHealth();
      
      if (healthCheck.healthy) {
        console.log('✅ SessionGuard: Session is healthy');
        setIsSessionHealthy(true);
        return true;
      }
      
      console.log('⚠️ SessionGuard: Session unhealthy, attempting recovery...');
      setIsSessionHealthy(false);
      
      const recovery = await recoverSession();
      
      if (recovery.recovered) {
        console.log('✅ SessionGuard: Session recovered successfully');
        await refreshUserSession();
        setIsSessionHealthy(true);
        options.onSessionRecovered?.();
        toast.success('Session recovered successfully');
        return true;
      } else {
        console.log('❌ SessionGuard: Session recovery failed');
        options.onSessionLost?.();
        toast.error('Session expired. Please log out and back in.');
        return false;
      }
    } catch (error) {
      console.error('❌ SessionGuard: Session check/recovery failed:', error);
      setIsSessionHealthy(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // Only run session health check after auth is established and user is available
  // Add a delay to prevent blocking the initial auth flow
  useEffect(() => {
    if (isAuthenticated && user) {
      // Delay session health check to avoid interfering with initial auth
      const healthCheckTimeout = setTimeout(() => {
        console.log('🔍 SessionGuard: Starting delayed session health check...');
        checkAndRecoverSession();
      }, 2000); // 2 second delay

      return () => clearTimeout(healthCheckTimeout);
    } else {
      // Reset session health when user is not authenticated
      setIsSessionHealthy(null);
    }
  }, [user?.id, isAuthenticated]);

  return {
    isSessionHealthy,
    isChecking,
    checkAndRecoverSession
  };
};
