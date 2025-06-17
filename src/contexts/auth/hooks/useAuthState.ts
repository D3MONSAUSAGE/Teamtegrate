
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User as AppUser, UserRole } from '@/types';

export const useAuthState = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Starting simplified auth initialization');

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Session error:', error);
        } else {
          console.log('AuthProvider: Session check complete:', !!session);
          setSession(session);
          
          // Create basic user object from session data
          if (session?.user) {
            const basicUser: AppUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || 'User',
              role: (session.user.user_metadata?.role as UserRole) || 'user',
              organizationId: session.user.user_metadata?.organization_id || null,
              avatar_url: session.user.user_metadata?.avatar_url || null,
              timezone: session.user.user_metadata?.timezone || null,
              createdAt: new Date(session.user.created_at),
            };
            setUser(basicUser);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('AuthProvider: Init error:', error);
        setSession(null);
        setUser(null);
      } finally {
        // Always set loading to false after initial check
        setLoading(false);
        console.log('AuthProvider: Loading set to false');
      }
    };

    // Set up auth state listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthProvider: Auth state change:', event);
        
        // Only handle actual auth changes, not initial session
        if (event !== 'INITIAL_SESSION') {
          setSession(session);
          
          if (session?.user) {
            const basicUser: AppUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || 'User',
              role: (session.user.user_metadata?.role as UserRole) || 'user',
              organizationId: session.user.user_metadata?.organization_id || null,
              avatar_url: session.user.user_metadata?.avatar_url || null,
              timezone: session.user.user_metadata?.timezone || null,
              createdAt: new Date(session.user.created_at),
            };
            setUser(basicUser);
          } else {
            setUser(null);
          }
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      console.log('AuthProvider: Cleaning up');
      subscription.unsubscribe();
    };
  }, []);

  const refreshUserSession = async (): Promise<void> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error && session) {
        setSession(session);
        if (session.user) {
          const basicUser: AppUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || 'User',
            role: (session.user.user_metadata?.role as UserRole) || 'user',
            organizationId: session.user.user_metadata?.organization_id || null,
            avatar_url: session.user.user_metadata?.avatar_url || null,
            timezone: session.user.user_metadata?.timezone || null,
            createdAt: new Date(session.user.created_at),
          };
          setUser(basicUser);
        }
      }
    } catch (error) {
      console.error('AuthProvider: Refresh error:', error);
    }
  };

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
