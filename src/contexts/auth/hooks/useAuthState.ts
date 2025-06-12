
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User as AppUser, UserRole } from '@/types';

export const useAuthState = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionHealthy, setSessionHealthy] = useState<boolean | null>(null);

  const fetchUserProfile = async (userId: string, retries = 3): Promise<AppUser | null> => {
    try {
      console.log('🔍 AuthState: Fetching user profile for:', userId, `(attempt ${4 - retries})`);
      
      // Wait a moment for auth.uid() to be available after session creation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify auth.uid() is available before querying
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.log('⚠️ AuthState: No authenticated user found');
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
          return await fetchUserProfile(userId, retries - 1);
        }
        setSessionHealthy(false);
        return null;
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ AuthState: Error fetching user profile:', error);
        
        // If it's an RLS error and we have retries left, wait and try again
        if (error.code === 'PGRST116' && retries > 0) {
          console.log('🔄 AuthState: RLS error, retrying after delay...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await fetchUserProfile(userId, retries - 1);
        }
        
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
      
      // Retry on network errors
      if (retries > 0) {
        console.log('🔄 AuthState: Retrying profile fetch due to error...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await fetchUserProfile(userId, retries - 1);
      }
      
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
        
        if (userProfile) {
          setUser(userProfile);
          console.log('✅ AuthState: Auth state updated successfully');
        } else {
          console.error('❌ AuthState: Failed to fetch user profile after retries');
          setSessionHealthy(false);
          // Don't clear session immediately, let session recovery handle it
        }
      } catch (error) {
        console.error('❌ AuthState: Profile fetch failed:', error);
        setUser(null);
        setSessionHealthy(false);
      } finally {
        setLoading(false);
      }
    } else {
      console.log('👋 AuthState: No session - clearing user state');
      setSession(null);
      setUser(null);
      setSessionHealthy(null);
      setLoading(false);
    }
  };

  const refreshUserSession = async (): Promise<void> => {
    try {
      console.log('🔄 AuthState: Refreshing user session...');
      setLoading(true);
      
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ AuthState: Error refreshing session:', error);
        setSessionHealthy(false);
        setLoading(false);
        return;
      }
      
      await updateAuthState(newSession);
      console.log('✅ AuthState: Session refresh complete');
    } catch (error) {
      console.error('❌ AuthState: Error refreshing session:', error);
      setSessionHealthy(false);
      setLoading(false);
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
            setLoading(false);
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
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    );

    // Initialize auth
    initializeAuth();
    
    // Fallback timeout to ensure loading never stays true indefinitely
    initializationTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log('⚠️ AuthState: Initialization timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 15000); // Increased timeout to 15 seconds

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
