
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User as AppUser, UserRole } from '@/types';

export const useAuthState = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false); // Start with false, only set to true when actually checking auth

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

      console.log('✅ AuthState: User profile fetched:', {
        id: data.id,
        email: data.email,
        role: data.role,
        organization_id: data.organization_id,
        name: data.name
      });

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
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    console.log('🚀 AuthState: Setting up auth initialization');
    
    const initializeAuth = async () => {
      try {
        // Get initial session without loading state for faster landing page
        console.log('🔍 AuthState: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthState: Error getting session:', error);
          return;
        }

        console.log('📄 AuthState: Initial session:', {
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        });
        
        if (isMounted) {
          setSession(session);

          // Only set loading and fetch profile if we have a session
          if (session?.user) {
            setLoading(true);
            console.log('👤 AuthState: User found in session, fetching profile...');
            const userProfile = await fetchUserProfile(session.user.id);
            if (isMounted) {
              setUser(userProfile);
              setLoading(false);
              console.log('✅ AuthState: Auth initialization complete:', {
                hasUser: !!userProfile,
                organizationId: userProfile?.organizationId
              });
            }
          } else {
            console.log('🏠 AuthState: No session - landing page can show immediately');
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ AuthState: Error in initializeAuth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 AuthState: Auth state change:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        });
        
        setSession(session);
        
        if (session?.user) {
          console.log('👤 AuthState: User authenticated, fetching profile...');
          setLoading(true);
          // Fetch profile for authenticated users
          setTimeout(() => {
            if (isMounted) {
              fetchUserProfile(session.user.id).then(userData => {
                if (isMounted) {
                  setUser(userData);
                  setLoading(false);
                  console.log('✅ AuthState: User profile loaded after auth change:', {
                    hasUser: !!userData,
                    organizationId: userData?.organizationId
                  });
                }
              });
            }
          }, 0);
        } else {
          console.log('👋 AuthState: User signed out');
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      isMounted = false;
      console.log('🧹 AuthState: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    loading,
    setUser,
    setSession,
    setLoading,
    refreshUserSession
  };
};
