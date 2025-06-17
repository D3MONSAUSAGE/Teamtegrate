
import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User as AppUser, UserRole } from '@/types';

export const useAuthState = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<AppUser | null> => {
    try {
      console.log('AuthProvider: Fetching user profile for:', userId, retryCount > 0 ? `(retry ${retryCount})` : '');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('AuthProvider: Error fetching user profile:', error);
        
        // Retry once on network errors or temporary failures
        if (retryCount === 0 && (error.code === 'PGRST301' || error.message.includes('network'))) {
          console.log('AuthProvider: Retrying profile fetch...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchUserProfile(userId, 1);
        }
        
        return null;
      }

      console.log('AuthProvider: User profile fetched successfully:', data);
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role as UserRole,
        organizationId: data.organization_id,
        avatar_url: data.avatar_url,
        timezone: data.timezone,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('AuthProvider: Error in fetchUserProfile:', error);
      
      // Retry once on network errors
      if (retryCount === 0) {
        console.log('AuthProvider: Retrying profile fetch after error...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchUserProfile(userId, 1);
      }
      
      return null;
    }
  };

  const refreshUserSession = async (): Promise<void> => {
    try {
      console.log('AuthProvider: Refreshing user session...');
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('AuthProvider: Error refreshing session:', error);
        return;
      }
      
      if (newSession?.user) {
        setSession(newSession);
        const userData = await fetchUserProfile(newSession.user.id);
        setUser(userData);
        console.log('AuthProvider: Session refreshed successfully');
      } else {
        console.log('AuthProvider: No session found during refresh');
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('AuthProvider: Error refreshing session:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    console.log('AuthProvider: Setting up auth initialization');
    
    // Set up timeout protection - force loading to false after 5 seconds
    timeoutRef.current = setTimeout(() => {
      if (isMounted) {
        console.log('AuthProvider: Timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 5000);
    
    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Starting auth initialization...');
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        console.log('AuthProvider: Initial session check completed:', !!session);
        
        if (isMounted) {
          setSession(session);

          if (session?.user) {
            console.log('AuthProvider: User found in session, fetching profile:', session.user.id);
            
            // Fetch profile but don't let it block the loading state
            fetchUserProfile(session.user.id).then(userProfile => {
              if (isMounted) {
                setUser(userProfile);
                console.log('AuthProvider: Profile fetch completed:', !!userProfile);
              }
            }).catch(profileError => {
              console.error('AuthProvider: Profile fetch failed:', profileError);
              if (isMounted) {
                setUser(null);
              }
            });
          } else {
            console.log('AuthProvider: No session - showing landing page');
            setUser(null);
          }
          
          // Always set loading to false after session check, regardless of profile fetch
          setLoading(false);
          
          // Clear timeout since we completed initialization
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      } catch (error) {
        console.error('AuthProvider: Error in initializeAuth:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener (only for subsequent changes, not initial load)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('AuthProvider: Auth state change:', event, !!session);
        
        // Skip INITIAL_SESSION event to avoid race conditions
        if (event === 'INITIAL_SESSION') {
          console.log('AuthProvider: Skipping INITIAL_SESSION event to avoid race conditions');
          return;
        }
        
        try {
          setSession(session);
          
          if (session?.user) {
            console.log('AuthProvider: User authenticated via state change, fetching profile:', session.user.id);
            
            const userData = await fetchUserProfile(session.user.id);
            if (isMounted) {
              setUser(userData);
            }
          } else {
            console.log('AuthProvider: User signed out via state change');
            setUser(null);
          }
        } catch (error) {
          console.error('AuthProvider: Error in auth state change handler:', error);
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      isMounted = false;
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    user,
    session,
    loading,
    setUser,
    setSession,
    setLoading,
    refreshUserSession
  };
};
