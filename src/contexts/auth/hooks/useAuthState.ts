
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

      // Only test organization ID function if user is authenticated
      console.log('🔍 AuthState: Testing get_current_user_organization_id function...');
      const { data: orgId, error: orgError } = await supabase.rpc('get_current_user_organization_id');
      console.log('🔍 AuthState: Organization ID function result:', {
        organizationId: orgId,
        error: orgError?.message,
        hasError: !!orgError,
        errorDetails: orgError
      });

      // Test basic auth functions
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
    
    // Set a timeout to prevent infinite loading (5 seconds for public pages)
    authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log('⏰ AuthState: Auth timeout reached, stopping loading state');
        setLoading(false);
        // Don't show error toast for public pages
      }
    }, 5000);

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
              // Only show toast if user was trying to authenticate
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

    // Check for existing session only once, after setting up the listener
    const checkInitialSession = async () => {
      try {
        console.log('🔍 AuthState: Initial session check...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthState: Error getting session:', error);
          if (isMounted) {
            setLoading(false);
            // Don't show error for public page visitors
          }
          return;
        }
        
        console.log('🔍 AuthState: Initial session check result:', {
          hasSession: !!session,
          sessionUserId: session?.user?.id,
          sessionUserEmail: session?.user?.email
        });
        
        if (session?.user && isMounted) {
          console.log('📄 AuthState: Initial session found, will be processed by auth listener');
          // The onAuthStateChange listener will handle this session
        } else {
          console.log('🏠 AuthState: No initial session found - showing public content');
          if (isMounted) {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ AuthState: Error in checkInitialSession:', error);
        if (isMounted) {
          setLoading(false);
          // Don't show error for public page visitors
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
