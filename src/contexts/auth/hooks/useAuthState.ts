
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
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ AuthState: Error fetching user profile:', error);
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
    
    console.log('🚀 AuthState: Setting up simplified auth initialization');
    
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
              console.log('✅ AuthState: User profile loaded successfully');
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
        console.log('🔍 AuthState: Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthState: Error getting session:', error);
          if (isMounted) {
            setLoading(false);
            toast.error('Failed to check authentication status. Please try logging in.');
          }
          return;
        }
        
        if (session?.user && isMounted) {
          console.log('📄 AuthState: Initial session found');
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
