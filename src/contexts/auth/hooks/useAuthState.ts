
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, checkSessionHealth, recoverSession } from '@/integrations/supabase/client';
import { User as AppUser, UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';

export const useAuthState = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Start with true for proper initialization
  const [sessionHealthy, setSessionHealthy] = useState<boolean | null>(null);

  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<AppUser | null> => {
    try {
      console.log('🔍 AuthState: Fetching user profile for:', userId, `(attempt ${retryCount + 1})`);
      
      // Check session health before making queries
      const healthCheck = await checkSessionHealth();
      if (!healthCheck.healthy && retryCount === 0) {
        console.log('⚠️ Session unhealthy, attempting recovery...');
        const recovery = await recoverSession();
        if (recovery.recovered) {
          console.log('✅ Session recovered, retrying user profile fetch...');
          return fetchUserProfile(userId, retryCount + 1);
        }
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ AuthState: Error fetching user profile:', error);
        
        // If it's an RLS error and session seems healthy, show helpful message
        if (error.message?.includes('policy') || error.message?.includes('permission')) {
          console.log('🔧 RLS policy error detected, this might be a session sync issue');
          setSessionHealthy(false);
          
          if (retryCount === 0) {
            toast.error('Session sync issue detected. Please refresh the page or log out and back in.');
          }
        }
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
      
      // First try session recovery
      const recovery = await recoverSession();
      if (recovery.recovered && recovery.session?.user) {
        console.log('✅ AuthState: Session recovered, fetching user data...');
        setSession(recovery.session);
        const userData = await fetchUserProfile(recovery.session.user.id);
        setUser(userData);
        console.log('✅ AuthState: User data updated after recovery:', userData);
        return;
      }
      
      // Fallback to regular session refresh
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
    
    console.log('🚀 AuthState: Setting up enhanced auth initialization');
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Step 1: Check session health first
        console.log('🔍 AuthState: Checking session health...');
        const healthCheck = await checkSessionHealth();
        
        if (healthCheck.healthy && healthCheck.session?.user) {
          console.log('✅ AuthState: Healthy session found, loading user...');
          
          if (isMounted) {
            setSession(healthCheck.session);
            setSessionHealthy(true);
            
            const userProfile = await fetchUserProfile(healthCheck.session.user.id);
            if (isMounted) {
              setUser(userProfile);
              console.log('✅ AuthState: Auth initialization complete with healthy session');
            }
          }
        } else {
          // Step 2: Try regular session check
          console.log('⚠️ AuthState: Session unhealthy, trying regular session check...');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ AuthState: Error getting session:', error);
            setSessionHealthy(false);
          } else if (session?.user) {
            console.log('📄 AuthState: Session found but may be stale, attempting to use it...');
            
            if (isMounted) {
              setSession(session);
              const userProfile = await fetchUserProfile(session.user.id);
              setUser(userProfile);
              
              if (!userProfile) {
                console.log('⚠️ AuthState: Could not load user profile, session may be invalid');
                setSessionHealthy(false);
                toast.error('Session appears to be expired. Please refresh the page or log out and back in.');
              }
            }
          } else {
            console.log('🏠 AuthState: No session found - user not authenticated');
            if (isMounted) {
              setUser(null);
              setSession(null);
              setSessionHealthy(null);
            }
          }
        }
      } catch (error) {
        console.error('❌ AuthState: Error in initializeAuth:', error);
        if (isMounted) {
          setSessionHealthy(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set up enhanced auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 AuthState: Enhanced auth state change handler:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        });
        
        setSession(session);
        
        if (session?.user) {
          console.log('👤 AuthState: User authenticated, fetching profile with session validation...');
          setLoading(true);
          
          // Add a small delay to ensure session is fully established
          setTimeout(async () => {
            if (isMounted) {
              const userData = await fetchUserProfile(session.user.id);
              if (isMounted) {
                setUser(userData);
                setLoading(false);
                
                if (userData) {
                  console.log('✅ AuthState: User profile loaded successfully after auth change');
                } else {
                  console.log('⚠️ AuthState: Failed to load user profile after auth change');
                }
              }
            }
          }, 100);
        } else {
          console.log('👋 AuthState: User signed out');
          setUser(null);
          setSessionHealthy(null);
          setLoading(false);
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      isMounted = false;
      console.log('🧹 AuthState: Cleaning up enhanced auth listener');
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
