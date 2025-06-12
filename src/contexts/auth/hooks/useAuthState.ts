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

  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<AppUser | null> => {
    try {
      console.log('🔍 AuthState: Starting profile fetch for user:', userId, 'attempt:', retryCount + 1);
      
      // Test current auth state before profile fetch
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      console.log('🔍 AuthState: Current auth state during profile fetch:', {
        currentUserId: currentUser?.id,
        hasSession: !!currentSession,
        sessionValid: currentSession?.expires_at ? new Date(currentSession.expires_at * 1000) > new Date() : false
      });

      if (!currentUser || currentUser.id !== userId) {
        console.error('❌ AuthState: Auth user mismatch during profile fetch');
        return null;
      }

      // Try to fetch user profile from database
      console.log('🔍 AuthState: Fetching user profile from database...');
      
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout after 10 seconds')), 10000)
      );
      
      const { data: userData, error: userError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;
        
      console.log('🔍 AuthState: Users table query result:', {
        hasData: !!userData,
        error: userError ? {
          message: userError.message,
          code: userError.code
        } : null
      });

      if (userError) {
        console.error('❌ AuthState: Database error during profile fetch:', userError);
        
        // For 500 errors or timeouts, create minimal user profile from auth data
        if (userError.message?.includes('500') || userError.message?.includes('timeout')) {
          console.log('🔧 AuthState: Creating minimal profile from auth data due to DB issues');
          const authUser = currentUser;
          if (authUser) {
            const minimalUser: AppUser = {
              id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || authUser.email || 'User',
              role: (authUser.user_metadata?.role as UserRole) || 'user',
              organizationId: authUser.user_metadata?.organization_id || '',
              avatar_url: authUser.user_metadata?.avatar_url,
              timezone: 'UTC',
              createdAt: new Date(),
            };
            console.log('🔧 AuthState: Using minimal profile:', minimalUser);
            setSessionHealthy(false);
            return minimalUser;
          }
        }
        return null;
      }

      if (!userData) {
        console.error('❌ AuthState: No user data returned from database');
        // Create minimal profile from auth data as fallback
        const authUser = currentUser;
        if (authUser) {
          const minimalUser: AppUser = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email || 'User',
            role: (authUser.user_metadata?.role as UserRole) || 'user',
            organizationId: authUser.user_metadata?.organization_id || '',
            avatar_url: authUser.user_metadata?.avatar_url,
            timezone: 'UTC',
            createdAt: new Date(),
          };
          console.log('🔧 AuthState: Using fallback profile from auth metadata:', minimalUser);
          setSessionHealthy(false);
          return minimalUser;
        }
        return null;
      }

      console.log('✅ AuthState: User profile fetched successfully:', {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        organization_id: userData.organization_id
      });

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
      
      // For timeout or 500 errors, try to create fallback user
      if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('500'))) {
        const { data: { user: currentUser } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
        if (currentUser) {
          const minimalUser: AppUser = {
            id: currentUser.id,
            email: currentUser.email || '',
            name: currentUser.user_metadata?.name || currentUser.email || 'User',
            role: (currentUser.user_metadata?.role as UserRole) || 'user',
            organizationId: currentUser.user_metadata?.organization_id || '',
            avatar_url: currentUser.user_metadata?.avatar_url,
            timezone: 'UTC',
            createdAt: new Date(),
          };
          console.log('🔧 AuthState: Using emergency fallback profile:', minimalUser);
          return minimalUser;
        }
      }
      
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
        console.log('✅ AuthState: User data updated after refresh:', userData);
      }
    } catch (error) {
      console.error('❌ AuthState: Error refreshing session:', error);
      setSessionHealthy(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;
    
    console.log('🚀 AuthState: Setting up simplified auth state management');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 AuthState: Auth state change event:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          sessionValid: session?.expires_at ? new Date(session.expires_at * 1000) > new Date() : false
        });

        // Clear any existing timeout
        if (authTimeout) {
          clearTimeout(authTimeout);
        }
        
        // Store session immediately
        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('👤 AuthState: User signed in, fetching profile...');
          try {
            const userData = await fetchUserProfile(session.user.id);
            if (isMounted) {
              setUser(userData);
              if (userData) {
                console.log('✅ AuthState: User profile loaded successfully after sign in');
              } else {
                console.log('❌ AuthState: Failed to load user profile after sign in');
              }
            }
          } catch (error) {
            console.error('❌ AuthState: Error loading user profile after sign in:', error);
            if (isMounted) {
              setUser(null);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 AuthState: User signed out');
          setSession(null);
          setUser(null);
          setSessionHealthy(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 AuthState: Token refreshed');
          // Keep existing user data
        } else if (event === 'INITIAL_SESSION' && session?.user) {
          console.log('🔄 AuthState: Initial session check');
          try {
            const userData = await fetchUserProfile(session.user.id);
            if (isMounted) {
              setUser(userData);
            }
          } catch (error) {
            console.error('❌ AuthState: Error loading user profile on initial session:', error);
            if (isMounted) {
              setUser(null);
            }
          }
        }
        
        // Always set loading to false after processing
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    // Set timeout for loading state
    authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log('⏰ AuthState: Auth timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 10000);

    return () => {
      isMounted = false;
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
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
