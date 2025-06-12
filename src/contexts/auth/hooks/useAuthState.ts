
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User as AppUser, UserRole } from '@/types';

export const useAuthState = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string): Promise<AppUser | null> => {
    try {
      console.log('AuthProvider: Fetching user profile for:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('AuthProvider: Error fetching user profile:', error);
        return null;
      }

      console.log('AuthProvider: User profile fetched:', data);
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
      console.error('AuthProvider: Error in fetchUserProfile:', error);
      return null;
    }
  };

  const refreshUserSession = async (): Promise<void> => {
    try {
      const { data: { session: newSession } } = await supabase.auth.getSession();
      if (newSession?.user) {
        setSession(newSession);
        const userData = await fetchUserProfile(newSession.user.id);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    console.log('AuthProvider: Setting up auth initialization');
    
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        console.log('AuthProvider: Initial session:', !!session);
        
        if (isMounted) {
          setSession(session);

          if (session?.user) {
            console.log('AuthProvider: User found in session:', session.user.id);
            const userProfile = await fetchUserProfile(session.user.id);
            setUser(userProfile);
          } else {
            console.log('AuthProvider: No user in session');
            setUser(null);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('AuthProvider: Error in initializeAuth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('AuthProvider: Auth state change:', event, !!session);
        
        setSession(session);
        
        if (session?.user) {
          console.log('AuthProvider: User authenticated:', session.user.id);
          const userProfile = await fetchUserProfile(session.user.id);
          setUser(userProfile);
        } else {
          console.log('AuthProvider: User signed out');
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      isMounted = false;
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once

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
