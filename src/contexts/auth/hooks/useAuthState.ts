
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User as AppUser, UserRole } from '@/types';

export const useAuthState = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

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
    
    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Starting auth initialization...');
        
        // Get initial session with retry logic
        let sessionResult;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          try {
            sessionResult = await supabase.auth.getSession();
            break;
          } catch (error) {
            console.warn(`AuthProvider: Session fetch attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            if (retryCount <= maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }
        
        if (!sessionResult) {
          console.error('AuthProvider: Failed to get session after retries');
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        
        const { data: { session }, error } = sessionResult;
        
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
            setLoading(true);
            console.log('AuthProvider: User found in session, fetching profile:', session.user.id);
            
            try {
              const userProfile = await fetchUserProfile(session.user.id);
              if (isMounted) {
                setUser(userProfile);
                console.log('AuthProvider: Profile fetch completed:', !!userProfile);
              }
            } catch (profileError) {
              console.error('AuthProvider: Profile fetch failed:', profileError);
              if (isMounted) {
                setUser(null);
              }
            } finally {
              if (isMounted) {
                setLoading(false);
              }
            }
          } else {
            console.log('AuthProvider: No session - showing landing page');
            setUser(null);
            setLoading(false);
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

    // Set up auth state listener with improved error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('AuthProvider: Auth state change:', event, !!session);
        
        try {
          setSession(session);
          
          if (session?.user) {
            console.log('AuthProvider: User authenticated, fetching profile:', session.user.id);
            setLoading(true);
            
            // Remove the setTimeout(0) - this was causing race conditions
            const userData = await fetchUserProfile(session.user.id);
            if (isMounted) {
              setUser(userData);
              setLoading(false);
            }
          } else {
            console.log('AuthProvider: User signed out');
            setUser(null);
            setLoading(false);
          }
        } catch (error) {
          console.error('AuthProvider: Error in auth state change handler:', error);
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      isMounted = false;
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
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
