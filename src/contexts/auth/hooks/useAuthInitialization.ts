
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseAuthInitializationProps {
  updateSession: (session: any) => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthInitialization = ({ updateSession, setLoading }: UseAuthInitializationProps) => {
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (!isMounted) return;
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('AuthInitialization: Session error:', error);
          setLoading(false);
        } else {
          console.log('AuthInitialization: Initial session check:', !!session);
          await updateSession(session);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('AuthInitialization: Init error:', error);
        await updateSession(null);
        setLoading(false);
      }
    };

    // Set up auth state listener with proper cleanup
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log('AuthInitialization: Auth state change:', event);
        
        // Only handle non-initial session changes
        if (event !== 'INITIAL_SESSION') {
          // Use requestAnimationFrame to defer async operations
          requestAnimationFrame(() => {
            if (isMounted) {
              updateSession(session).catch(error => {
                console.error('AuthInitialization: Update session error:', error);
                if (isMounted) setLoading(false);
              });
            }
          });
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove dependencies to prevent re-initialization
};
