
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
      console.log('🔍 AuthState: Starting profile fetch for user:', userId);
      
      // Test current auth state before profile fetch
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      console.log('🔍 AuthState: Current auth state during profile fetch:', {
        currentUserId: currentUser?.id,
        currentUserEmail: currentUser?.email,
        hasSession: !!currentSession,
        sessionUserId: currentSession?.user?.id,
        accessTokenLength: currentSession?.access_token?.length || 0,
        sessionValid: currentSession?.expires_at ? new Date(currentSession.expires_at * 1000) > new Date() : false
      });

      if (!currentUser || currentUser.id !== userId) {
        console.error('❌ AuthState: Auth user mismatch during profile fetch:', {
          expectedUserId: userId,
          actualUserId: currentUser?.id
        });
        return null;
      }

      // Test direct users table access
      console.log('🔍 AuthState: Testing direct users table access...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      console.log('🔍 AuthState: Users table query result:', {
        hasData: !!userData,
        userData: userData,
        error: userError ? {
          message: userError.message,
          code: userError.code,
          details: userError.details,
          hint: userError.hint
        } : null
      });

      if (userError) {
        console.error('❌ AuthState: Database error during profile fetch:', {
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
          code: userError.code
        });
        
        // Check if it's an RLS issue
        if (userError.code === 'PGRST116' || userError.message?.includes('row-level security')) {
          console.error('❌ AuthState: RLS policy preventing user access');
          toast.error('Authentication error: Unable to access user data due to security policies');
        } else if (userError.code === '42P01') {
          console.error('❌ AuthState: Users table does not exist');
          toast.error('Database error: User table not found');
        } else {
          console.error('❌ AuthState: Unknown database error');
          toast.error('Database connection error. Please try again.');
        }
        return null;
      }

      if (!userData) {
        console.error('❌ AuthState: No user data returned from database');
        toast.error('User profile not found. Please contact support.');
        return null;
      }

      console.log('✅ AuthState: User profile fetched successfully:', {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        organization_id: userData.organization_id,
        name: userData.name
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

      // Test organization function if organization exists
      if (userData.organization_id) {
        console.log('🔍 AuthState: Testing get_current_user_organization_id function...');
        const { data: orgId, error: orgError } = await supabase.rpc('get_current_user_organization_id');
        
        console.log('🔍 AuthState: Organization ID function result:', {
          organizationId: orgId,
          expectedOrgId: userData.organization_id,
          match: orgId === userData.organization_id,
          error: orgError?.message
        });
      } else {
        console.warn('⚠️ AuthState: User has no organization ID');
        toast.error('Your account needs to be associated with an organization. Please contact support.');
      }

      return appUser;

    } catch (error) {
      console.error('❌ AuthState: Error in fetchUserProfile:', error);
      setSessionHealthy(false);
      
      if (error instanceof Error) {
        console.error('❌ AuthState: Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        toast.error(`Profile loading failed: ${error.message}`);
      } else {
        console.error('❌ AuthState: Unknown error type:', error);
        toast.error('Authentication failed. Please try again.');
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
      toast.error('Failed to refresh session. Please log in again.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;
    
    console.log('🚀 AuthState: Setting up auth state management');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 AuthState: Auth state change event:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          sessionValid: session?.expires_at ? new Date(session.expires_at * 1000) > new Date() : false
        });

        // Clear any existing timeout
        if (authTimeout) {
          clearTimeout(authTimeout);
        }
        
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
              toast.error('Failed to load user profile. Please try refreshing the page.');
            }
          }
        } else if (event === 'SIGNED_OUT' || !session) {
          console.log('👋 AuthState: User signed out or no session');
          setUser(null);
          setSessionHealthy(null);
        }
        
        // Always set loading to false after processing auth state
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    // Set timeout for loading state (in case no auth events fire)
    authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log('⏰ AuthState: Auth timeout reached, checking session manually');
        
        // Manual session check as fallback
        supabase.auth.getSession().then(({ data: { session }, error }) => {
          if (error) {
            console.error('❌ AuthState: Error getting session on timeout:', error);
          } else if (session) {
            console.log('📄 AuthState: Found existing session on timeout check');
            // This should trigger the auth state change listener
          } else {
            console.log('🚫 AuthState: No session found on timeout check');
          }
          
          if (isMounted) {
            setLoading(false);
          }
        });
      }
    }, 5000); // 5 second timeout

    // Initial session check
    const checkInitialSession = async () => {
      try {
        console.log('🔍 AuthState: Checking initial session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthState: Error getting initial session:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        
        console.log('🔍 AuthState: Initial session result:', {
          hasSession: !!session,
          sessionUserId: session?.user?.id,
          sessionValid: session?.expires_at ? new Date(session.expires_at * 1000) > new Date() : false
        });
        
        // Don't manually set session here - let the auth listener handle it
        // This prevents double processing
        
      } catch (error) {
        console.error('❌ AuthState: Error in checkInitialSession:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Check session immediately
    checkInitialSession();

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
