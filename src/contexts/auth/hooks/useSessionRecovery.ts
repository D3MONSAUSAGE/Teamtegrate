
import { useState, useCallback } from 'react';
import { checkSessionHealth, recoverSession } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const useSessionRecovery = () => {
  const [isRecovering, setIsRecovering] = useState(false);

  const attemptSessionRecovery = useCallback(async (): Promise<boolean> => {
    if (isRecovering) return false;
    
    setIsRecovering(true);
    
    try {
      console.log('🔧 SessionRecovery: Attempting session recovery...');
      
      // First check if session is actually unhealthy
      const healthCheck = await checkSessionHealth();
      
      if (healthCheck.healthy) {
        console.log('✅ SessionRecovery: Session is already healthy');
        setIsRecovering(false);
        return true;
      }
      
      console.log('⚠️ SessionRecovery: Session unhealthy, attempting recovery...');
      
      // Attempt to recover the session
      const recovery = await recoverSession();
      
      if (recovery.recovered) {
        console.log('✅ SessionRecovery: Session recovered successfully');
        toast.success('Session recovered successfully');
        setIsRecovering(false);
        return true;
      } else {
        console.log('❌ SessionRecovery: Session recovery failed');
        toast.error('Session expired. Please log out and back in.');
        setIsRecovering(false);
        return false;
      }
    } catch (error) {
      console.error('❌ SessionRecovery: Session recovery failed:', error);
      toast.error('Session recovery failed. Please try logging in again.');
      setIsRecovering(false);
      return false;
    }
  }, [isRecovering]);

  return {
    isRecovering,
    attemptSessionRecovery
  };
};
