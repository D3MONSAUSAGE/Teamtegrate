
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, checkSessionHealth, recoverSession } from '@/integrations/supabase/client';
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
    
    console.log('🚀 AuthState: Setting up auth initialization');
    
    const initializeAuth = async () => {
      try {
        console.log('🔍 AuthState: Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthState: Error getting session:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        
        if (session?.user) {
          console.log('📄 AuthState: Session found, loading user profile...');
          
          if (isMounted) {
            setSession(session);
            const userProfile = await fetchUserProfile(session.user.id);
            if (isMounted) {
              setUser(userProfile);
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
      } catch (error) {
        console.error('❌ AuthState: Error in initializeAuth:', error);
        if (isMounted) {
          setSessionHealthy(false);
        }
      } finally {
        if (isMounted) {
          console.log('✅ AuthState: Setting loading to false');
          setLoading(false);
        }
      }
    };

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
        
        setSession(session);
        
        if (session?.user) {
          console.log('👤 AuthState: User authenticated, fetching profile...');
          const userData = await fetchUserProfile(session.user.id);
          if (isMounted) {
            setUser(userData);
            setLoading(false);
          }
        } else {
          console.log('👋 AuthState: User signed out');
          if (isMounted) {
            setUser(null);
            setSessionHealthy(null);
            setLoading(false);
          }
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
    sessionHealthy,
    setUser,
    setSession,
    setLoading,
    refreshUserSession
  };
};
