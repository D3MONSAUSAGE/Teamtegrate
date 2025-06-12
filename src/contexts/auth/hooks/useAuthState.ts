
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User as AppUser, UserRole } from '@/types';

export const useAuthState = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionHealthy, setSessionHealthy] = useState<boolean | null>(null);

  const fetchUserProfile = async (userId: string): Promise<AppUser | null> => {
    try {
      console.log('🔍 AuthState: Fetching user profile for:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ AuthState: Error fetching user profile:', error);
        setSessionHealthy(false);
        return null;
      }

      if (!data) {
        console.error('❌ AuthState: No user data returned');
        setSessionHealthy(false);
        return null;
      }

      console.log('✅ AuthState: User profile fetched successfully:', {
        id: data.id,
        email: data.email,
        role: data.role,
        organization_id: data.organization_id,
        name: data.name
      });

      setSessionHealthy(true);

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
      console.error('❌ AuthState: Error in fetchUserProfile:', error);
      setSessionHealthy(false);
      return null;
    }
  };

  const updateAuthState = async (session: Session | null) => {
    console.log('🔄 AuthState: Updating auth state:', { hasSession: !!session, userId: session?.user?.id });
    
    if (session?.user) {
      setSession(session);
      
      try {
        const userProfile = await fetchUserProfile(session.user.id);
        setUser(userProfile);
      } catch (error) {
        console.error('❌ AuthState: Profile fetch failed:', error);
        setUser(null);
        setSessionHealthy(false);
      }
    } else {
      console.log('👋 AuthState: No session - clearing user state');
      setSession(null);
      setUser(null);
      setSessionHealthy(null);
    }
  };

  const refreshUserSession = async (): Promise<void> => {
    try {
      console.log('🔄 AuthState: Refreshing user session...');
      
      const { data: { session: newSession } } = await supabase.auth.getSession();
      await updateAuthState(newSession);
      
      console.log('✅ AuthState: Session refresh complete');
    } catch (error) {
      console.error('❌ AuthState: Error refreshing session:', error);
      setSessionHealthy(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let initializationTimeout: NodeJS.Timeout;
    
    console.log('🚀 AuthState: Setting up auth initialization');
    
    const initializeAuth = async () => {
      try {
        console.log('🔍 AuthState: Getting initial session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthState: Error getting session:', error);
          if (isMounted) {
            setSession(null);
            setUser(null);
            setSessionHealthy(false);
          }
          return;
        }
        
        if (isMounted) {
          await updateAuthState(session);
        }
      } catch (error) {
        console.error('❌ AuthState: Error in initializeAuth:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setSessionHealthy(false);
        }
      } finally {
        if (isMounted) {
          console.log('✅ AuthState: Initialization complete, setting loading to false');
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 AuthState: Auth state change:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
        });
        
        try {
          await updateAuthState(session);
        } catch (error) {
          console.error('❌ AuthState: Error in auth state change handler:', error);
        } finally {
          // Always ensure loading is false after any auth state change
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    );

    // Initialize auth with timeout fallback
    initializeAuth();
    
    // Fallback timeout to ensure loading never stays true indefinitely
    initializationTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log('⚠️ AuthState: Initialization timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => {
      isMounted = false;
      clearTimeout(initializationTimeout);
      console.log('🧹 AuthState: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    loading,
    sessionHealthy,
    setUser,
    setSession,
    setLoading,
    refreshUserSession
  };
};
