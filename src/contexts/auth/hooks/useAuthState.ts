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

      // Test direct users table access with timeout and retry
      console.log('🔍 AuthState: Testing direct users table access...');
      
      const fetchWithRetry = async (retries = 3): Promise<any> => {
        for (let i = 0; i < retries; i++) {
          try {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout after 15 seconds')), 15000)
            );
            
            const dbPromise = supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();
              
            const { data: userData, error: userError } = await Promise.race([
              dbPromise,
              timeoutPromise
            ]) as any;

            if (!userError) {
              return { userData, userError: null };
            }

            console.warn(`⚠️ AuthState: Attempt ${i + 1} failed:`, userError.message);
            
            if (i < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
            } else {
              return { userData: null, userError };
            }
          } catch (error) {
            console.warn(`⚠️ AuthState: Attempt ${i + 1} threw error:`, error);
            if (i === retries - 1) {
              return { userData: null, userError: error };
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      };

      const { userData, userError } = await fetchWithRetry();
        
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
        
        // Handle specific database errors more gracefully
        if (userError.code === 'PGRST116' || userError.message?.includes('row-level security')) {
          console.error('❌ AuthState: RLS policy preventing user access');
          // Don't show error for RLS - this might be expected
        } else if (userError.code === '42P01') {
          console.error('❌ AuthState: Users table does not exist');
          toast.error('Database error: User table not found');
        } else if (userError.message?.includes('500') || userError.message?.includes('timeout')) {
          console.error('❌ AuthState: Database server error or timeout');
          // For 500 errors, create minimal user profile from auth data
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
            setSessionHealthy(false); // Mark as unhealthy but functional
            return minimalUser;
          }
        } else {
          console.error('❌ AuthState: Unknown database error');
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
        
        // Store session immediately to prevent loss
        setSession(session);
        
        if (event === 'SIGNED_IN') {
          console.log('👤 AuthState: User signed in, fetching profile...');
          
          if (session?.user) {
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
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 AuthState: User signed out or no session');
          setSession(null);
          setUser(null);
          setSessionHealthy(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 AuthState: Token refreshed');
          // Keep existing user data, don't refetch
        } else if (event === 'INITIAL_SESSION') {
          console.log('🔄 AuthState: Initial session check');
          
          if (session?.user) {
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
            // Force session update
            setSession(session);
            if (session.user) {
              fetchUserProfile(session.user.id).then(userData => {
                if (isMounted) {
                  setUser(userData);
                }
              });
            }
          } else {
            console.log('🚫 AuthState: No session found on timeout check');
          }
          
          if (isMounted) {
            setLoading(false);
          }
        });
      }
    }, 10000); // 10 second timeout

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
