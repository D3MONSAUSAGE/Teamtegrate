
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseAuthInitializationProps {
  updateSession: (session: any) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthInitialization = ({ updateSession, setLoading }: UseAuthInitializationProps) => {
  useEffect(() => {
    console.log('AuthInitialization: Starting auth setup');

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthInitialization: Session error:', error);
        } else {
          console.log('AuthInitialization: Initial session check:', !!session);
          updateSession(session);
        }
      } catch (error) {
        console.error('AuthInitialization: Init error:', error);
        updateSession(null);
      } finally {
        setLoading(false);
        console.log('AuthInitialization: Loading complete');
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthInitialization: Auth state change:', event);
        if (event !== 'INITIAL_SESSION') {
          updateSession(session);
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      console.log('AuthInitialization: Cleaning up');
      subscription.unsubscribe();
    };
  }, [updateSession, setLoading]);
};
