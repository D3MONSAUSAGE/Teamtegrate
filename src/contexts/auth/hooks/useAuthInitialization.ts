
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseAuthInitializationProps {
  updateSession: (session: any) => Promise<void>;
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
          setLoading(false);
        } else {
          console.log('AuthInitialization: Initial session check:', !!session);
          await updateSession(session);
        }
      } catch (error) {
        console.error('AuthInitialization: Init error:', error);
        await updateSession(null);
        setLoading(false);
      }
    };

    // Set up auth state listener - MUST be synchronous to prevent deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthInitialization: Auth state change:', event);
        
        // Only handle non-initial session changes
        if (event !== 'INITIAL_SESSION') {
          // Use setTimeout to defer async operations and prevent deadlock
          setTimeout(() => {
            updateSession(session).catch(error => {
              console.error('AuthInitialization: Update session error:', error);
              setLoading(false);
            });
          }, 0);
        }
      }
    );

    // Initialize auth after setting up listener
    initializeAuth();

    return () => {
      console.log('AuthInitialization: Cleaning up');
      subscription.unsubscribe();
    };
  }, []); // Remove dependencies to prevent re-initialization
};
