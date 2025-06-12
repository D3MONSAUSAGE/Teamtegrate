
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User as AppUser, UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';

export const useAuthState = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionHealthy, setSessionHealthy] = useState<boolean | null>(null);

  const fetchUserProfile = async (userId: string): Promise<AppUser | null> => {
    try {
      console.log('🔍 AuthState: Fetching user profile for:', userId);
      
      // Simple profile fetch with timeout
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      console.log('🔍 AuthState: Users table query result:', {
        hasData: !!userData,
        error: userError ? {
          message: userError.message,
          code: userError.code
        } : null
      });

      if (userError || !userData) {
        console.log('⚠️ AuthState: Database error or no user data, using auth fallback');
        // Get current auth user for fallback
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const fallbackUser: AppUser = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email || 'User',
            role: (authUser.user_metadata?.role as UserRole) || 'user',
            organizationId: authUser.user_metadata?.organization_id || '',
            avatar_url: authUser.user_metadata?.avatar_url,
            timezone: 'UTC',
            createdAt: new Date(),
          };
          setSessionHealthy(false);
          return fallbackUser;
        }
        return null;
      }

      setSessionHealthy(true);
      const appUser: AppUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email,
        role: userData.role as UserRole,
        organizationId: userData.organization_id || '',
        avatar_url: userData.avatar_url,
        timezone: userData.timezone || 'UTC',
        createdAt: new Date(),
      };

      return appUser;

    } catch (error) {
      console.error('❌ AuthState: Error in fetchUserProfile:', error);
      setSessionHealthy(false);
      return null;
    }
  };

  const refreshUserSession = async (): Promise<void> => {
    try {
      console.log('🔄 AuthState: Refreshing user session...');
      
      const { data: { session: newSession } } = await supabase.auth.getSession();
      if (newSession?.user) {
        console.log('✅ AuthState: Session refreshed, fetching user data...');
        setSession(newSession);
        const userData = await fetchUserProfile(newSession.user.id);
        setUser(userData);
      }
    } catch (error) {
      console.error('❌ AuthState: Error refreshing session:', error);
      setSessionHealthy(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    console.log('🚀 AuthState: Setting up auth state management');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 AuthState: Auth state change event:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id
        });

        // Always update session state immediately
        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('👤 AuthState: User signed in, fetching profile...');
          try {
            const userData = await fetchUserProfile(session.user.id);
            if (isMounted) {
              setUser(userData);
              console.log('✅ AuthState: User profile loaded after sign in');
            }
          } catch (error) {
            console.error('❌ AuthState: Error loading profile after sign in:', error);
            if (isMounted) {
              setUser(null);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 AuthState: User signed out');
          setUser(null);
          setSessionHealthy(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 AuthState: Token refreshed, keeping existing user');
          // Don't refetch user data on token refresh
        } else if (event === 'INITIAL_SESSION' && session?.user) {
          console.log('🔄 AuthState: Initial session detected');
          try {
            const userData = await fetchUserProfile(session.user.id);
            if (isMounted) {
              setUser(userData);
            }
          } catch (error) {
            console.error('❌ AuthState: Error loading profile on initial session:', error);
            if (isMounted) {
              setUser(null);
            }
          }
        }
        
        // Set loading to false after processing any auth event
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    // Set a maximum loading timeout
    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('⏰ AuthState: Loading timeout reached');
        setLoading(false);
      }
    }, 5000); // Reduced from 10s to 5s

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
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
