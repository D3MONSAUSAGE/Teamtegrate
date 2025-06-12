
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
      
      // Add timeout to profile fetch (30 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 30000);
      });

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

      // Test organization ID function with better error handling
      console.log('🔍 AuthState: Testing get_current_user_organization_id function...');
      const orgIdPromise = supabase.rpc('get_current_user_organization_id');
      const { data: orgId, error: orgError } = await Promise.race([orgIdPromise, timeoutPromise]);
      
      console.log('🔍 AuthState: Organization ID function result:', {
        organizationId: orgId,
        error: orgError?.message,
        hasError: !!orgError,
        errorDetails: orgError
      });

      // Test basic auth functions with timeout
      console.log('🔍 AuthState: Testing direct users table access...');
      const userQueryPromise = supabase
        .from('users')
        .select('id, email, organization_id, role, name')
        .eq('id', userId)
        .single();
        
      const { data: authTestData, error: authTestError } = await Promise.race([userQueryPromise, timeoutPromise]);
      
      console.log('🔍 AuthState: Direct users table query result:', {
        data: authTestData,
        error: authTestError?.message,
        hasData: !!authTestData,
        errorCode: authTestError?.code,
        errorDetails: authTestError?.details
      });

      // If basic query failed, provide detailed error info
      if (authTestError) {
        console.error('❌ AuthState: Direct user query failed:', {
          message: authTestError.message,
          details: authTestError.details,
          hint: authTestError.hint,
          code: authTestError.code
        });
        
        // Check if it's an RLS issue
        if (authTestError.code === 'PGRST116' || authTestError.message?.includes('row-level security')) {
          console.error('❌ AuthState: RLS policy preventing user access');
          toast.error('Authentication error: Unable to access user data');
        } else if (authTestError.code === '42P01') {
          console.error('❌ AuthState: Users table does not exist');
          toast.error('Database error: User table not found');
        } else {
          console.error('❌ AuthState: Unknown database error');
          toast.error('Database connection error. Please try again.');
        }
        return null;
      }

      // Get full user profile
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) {
        console.error('❌ AuthState: Error fetching full user profile:', error);
        console.log('❌ AuthState: Profile fetch error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Use the basic data if available as fallback
        if (authTestData) {
          console.log('🔄 AuthState: Using fallback user data');
          const fallbackUser: AppUser = {
            id: authTestData.id,
            email: authTestData.email,
            name: authTestData.name || authTestData.email,
            role: (authTestData.role as UserRole) || 'user',
            organizationId: authTestData.organization_id || '',
            timezone: 'UTC',
            createdAt: new Date(),
          };
          setSessionHealthy(true);
          return fallbackUser;
        }
        
        toast.error('Failed to load user profile. Please try logging in again.');
        return null;
      }

      if (!data) {
        console.error('❌ AuthState: No user data returned');
        toast.error('User profile not found. Please contact support.');
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

      const userData: AppUser = {
        id: data.id,
        email: data.email,
        name: data.name || data.email,
        role: data.role as UserRole,
        organizationId: data.organization_id || '',
        avatar_url: data.avatar_url,
        timezone: data.timezone || 'UTC',
        createdAt: new Date(),
      };

      // Warn if organization is missing
      if (!userData.organizationId) {
        console.warn('⚠️ AuthState: User has no organization ID');
        toast.error('Your account needs to be associated with an organization. Please contact support.');
      }

      return userData;

    } catch (error) {
      console.error('❌ AuthState: Error in fetchUserProfile:', error);
      setSessionHealthy(false);
      
      if (error instanceof Error) {
        if (error.message === 'Profile fetch timeout') {
          console.error('❌ AuthState: Profile fetch timed out');
          toast.error('Profile loading timed out. Please try again.');
        } else {
          console.error('❌ AuthState: Unexpected error:', error.message);
          toast.error('An unexpected error occurred. Please try again.');
        }
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
    
    console.log('🚀 AuthState: Setting up simplified auth initialization');
    
    // Reduced timeout for better UX (3 seconds for public pages)
    authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log('⏰ AuthState: Auth timeout reached, stopping loading state');
        setLoading(false);
      }
    }, 3000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 AuthState: Auth state change:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        });

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
              if (userData) {
                console.log('✅ AuthState: User profile loaded successfully');
              } else {
                console.log('❌ AuthState: Failed to load user profile');
              }
            }
          } catch (error) {
            console.error('❌ AuthState: Error loading user profile:', error);
            if (isMounted) {
              setUser(null);
              if (event === 'SIGNED_IN') {
                toast.error('Failed to load user profile. Please try refreshing the page.');
              }
            }
          }
        } else {
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

    // Simplified initial session check
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
          sessionUserId: session?.user?.id
        });
        
        // If no session, stop loading immediately for public access
        if (!session && isMounted) {
          console.log('🏠 AuthState: No session found - enabling public access');
          setLoading(false);
        }
        // If session exists, the auth listener will handle it
        
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
