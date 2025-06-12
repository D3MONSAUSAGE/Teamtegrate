
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
      
      // Debug: Check current auth state before profile fetch
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      console.log('🔍 AuthState: Current auth state during profile fetch:', {
        currentUserId: currentUser?.id,
        currentUserEmail: currentUser?.email,
        hasSession: !!currentSession,
        sessionUserId: currentSession?.user?.id,
        accessTokenLength: currentSession?.access_token?.length || 0
      });

      // DETAILED AUTH DEBUG: Test organization ID function before fetching profile
      console.log('🔍 AuthState: Testing get_current_user_organization_id function...');
      const { data: orgId, error: orgError } = await supabase.rpc('get_current_user_organization_id');
      console.log('🔍 AuthState: Organization ID function result:', {
        organizationId: orgId,
        error: orgError?.message,
        hasError: !!orgError,
        errorDetails: orgError
      });

      // DETAILED AUTH DEBUG: Test basic auth functions
      console.log('🔍 AuthState: Testing basic auth recognition...');
      const { data: authTestData, error: authTestError } = await supabase
        .from('users')
        .select('id, email, organization_id')
        .eq('id', userId)
        .single();
      
      console.log('🔍 AuthState: Direct users table query result:', {
        data: authTestData,
        error: authTestError?.message,
        hasData: !!authTestData
      });
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ AuthState: Error fetching user profile:', error);
        console.log('❌ AuthState: Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      if (!data) {
        console.error('❌ AuthState: No user data returned');
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
    
    console.log('🚀 AuthState: Setting up enhanced auth initialization with DETAILED debugging');
    
    // Set a timeout to prevent infinite loading (10 seconds)
    authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log('⏰ AuthState: Auth timeout reached, stopping loading state');
        setLoading(false);
        toast.error('Authentication timeout. Please refresh the page or try logging in again.');
      }
    }, 10000);

    // Set up auth state listener - this is the primary source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 AuthState: Auth state change:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        });

        // DETAILED AUTH DEBUG: Enhanced session debugging
        if (session) {
          console.log('🔍 AuthState: DETAILED SESSION DEBUG:', {
            accessToken: session.access_token ? 'EXISTS' : 'MISSING',
            accessTokenLength: session.access_token?.length || 0,
            accessTokenStart: session.access_token ? session.access_token.substring(0, 20) + '...' : 'N/A',
            refreshToken: session.refresh_token ? 'EXISTS' : 'MISSING',
            expiresAt: session.expires_at,
            expiresAtDate: session.expires_at ? new Date(session.expires_at * 1000) : 'N/A',
            userMetadata: session.user?.user_metadata,
            appMetadata: session.user?.app_metadata,
            userRole: session.user?.user_metadata?.role,
            sessionUserId: session.user?.id,
            sessionUserEmail: session.user?.email
          });

          // DETAILED AUTH DEBUG: Test auth functions immediately after session change
          console.log('🧪 AuthState: DETAILED AUTH FUNCTION TESTING after session change...');
          try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const { data: { session: authSession } } = await supabase.auth.getSession();
            
            console.log('🧪 AuthState: Auth.getUser() result:', {
              hasUser: !!authUser,
              userId: authUser?.id,
              userEmail: authUser?.email,
              userMetadata: authUser?.user_metadata,
              userLastSignInAt: authUser?.last_sign_in_at
            });
            
            console.log('🧪 AuthState: Auth.getSession() result:', {
              hasSession: !!authSession,
              sessionUserId: authSession?.user?.id,
              tokenExists: !!authSession?.access_token,
              tokenValid: authSession?.expires_at ? new Date(authSession.expires_at * 1000) > new Date() : false
            });

            // DETAILED AUTH DEBUG: Test organization ID function with detailed logging
            console.log('🧪 AuthState: Testing get_current_user_organization_id function...');
            const { data: orgTestId, error: orgTestError } = await supabase.rpc('get_current_user_organization_id');
            console.log('🧪 AuthState: Organization ID function test result:', {
              organizationId: orgTestId,
              hasOrgId: orgTestId !== null && orgTestId !== undefined,
              error: orgTestError?.message,
              errorCode: orgTestError?.code,
              errorDetails: orgTestError?.details,
              errorHint: orgTestError?.hint,
              hasError: !!orgTestError
            });

            // DETAILED AUTH DEBUG: Test direct users table access
            if (authUser?.id) {
              console.log('🧪 AuthState: Testing direct users table access...');
              const { data: directUserData, error: directUserError } = await supabase
                .from('users')
                .select('id, email, organization_id, role, name')
                .eq('id', authUser.id)
                .single();
              
              console.log('🧪 AuthState: Direct users table access result:', {
                hasData: !!directUserData,
                userData: directUserData,
                error: directUserError?.message,
                errorCode: directUserError?.code,
                canAccessUsersTable: !directUserError
              });
            }
          } catch (testError) {
            console.error('❌ AuthState: DETAILED auth function test failed:', testError);
          }
        } else {
          console.log('👋 AuthState: No session - user signed out or no active session');
        }
        
        // Clear the timeout since we got an auth event
        if (authTimeout) {
          clearTimeout(authTimeout);
        }
        
        setSession(session);
        
        if (session?.user) {
          console.log('👤 AuthState: User authenticated, fetching profile...');
          
          try {
            const userData = await fetchUserProfile(session.user.id);
            if (isMounted) {
              setUser(userData);
              console.log('✅ AuthState: User profile loaded successfully:', userData);
            }
          } catch (error) {
            console.error('❌ AuthState: Error loading user profile:', error);
            if (isMounted) {
              setUser(null);
              toast.error('Failed to load user profile. Please try refreshing the page.');
            }
          }
        } else {
          console.log('👋 AuthState: User signed out');
          setUser(null);
          setSessionHealthy(null);
        }
        
        // Always set loading to false after processing auth state
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    // Check for existing session only once, after setting up the listener
    const checkInitialSession = async () => {
      try {
        console.log('🔍 AuthState: DETAILED initial session check...');
        
        // DETAILED AUTH DEBUG: Check auth functions during initialization
        console.log('🔍 AuthState: Testing auth functions during initialization...');
        const { data: { user: initialUser }, error: userError } = await supabase.auth.getUser();
        console.log('🔍 AuthState: Initial auth.getUser() result:', {
          hasUser: !!initialUser,
          userId: initialUser?.id,
          userEmail: initialUser?.email,
          userError: userError?.message,
          lastSignIn: initialUser?.last_sign_in_at
        });
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthState: Error getting session:', error);
          if (isMounted) {
            setLoading(false);
            toast.error('Failed to check authentication status. Please try logging in.');
          }
          return;
        }
        
        console.log('🔍 AuthState: Initial session check DETAILED result:', {
          hasSession: !!session,
          sessionUserId: session?.user?.id,
          sessionUserEmail: session?.user?.email,
          sessionMatches: session?.user?.id === initialUser?.id,
          tokenExists: !!session?.access_token,
          tokenExpires: session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A',
          tokenValid: session?.expires_at ? new Date(session.expires_at * 1000) > new Date() : false
        });
        
        if (session?.user && isMounted) {
          console.log('📄 AuthState: Initial session found, will be processed by auth listener');
          // The onAuthStateChange listener will handle this session
          // We don't need to do anything here to avoid double processing
        } else {
          console.log('🏠 AuthState: No initial session found');
          if (isMounted) {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ AuthState: Error in checkInitialSession:', error);
        if (isMounted) {
          setLoading(false);
          toast.error('Authentication check failed. Please try refreshing the page.');
        }
      }
    };

    // Small delay to ensure the listener is set up before checking session
    setTimeout(checkInitialSession, 100);

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
