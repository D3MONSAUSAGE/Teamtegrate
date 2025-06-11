
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppUser, UserRole } from '@/types';
import { AuthContextType } from './types';
import { createBasicUserFromSession, setupAuthTimeout } from './utils/authHelpers';
import { useAuthOperations } from './hooks/useAuthOperations';
import { hasRoleAccess, canManageUser } from './roleUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Set up auth timeout
  useEffect(() => {
    const timeout = setupAuthTimeout(loading, setLoading);
    return () => clearTimeout(timeout);
  }, [loading]);

  // Fetch full user profile from database
  const fetchUserProfile = async (userId: string): Promise<AppUser | null> => {
    try {
      console.log('Fetching user profile for:', userId);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      console.log('User profile fetched:', userData);
      
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role as UserRole,
        organization_id: userData.organization_id,
        avatar_url: userData.avatar_url,
        timezone: userData.timezone,
        createdAt: new Date(userData.created_at)
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  // Auth state change handler
  useEffect(() => {
    console.log('Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, 'Session:', !!session);
        
        setSession(session);
        
        if (session?.user) {
          // Fetch complete user profile from database
          const fullUser = await fetchUserProfile(session.user.id);
          if (fullUser) {
            setUser(fullUser);
            console.log('Full user profile loaded:', fullUser);
          } else {
            // Fallback to basic user if profile fetch fails
            const basicUser = createBasicUserFromSession(session.user);
            setUser(basicUser);
            console.warn('Using basic user profile, organization_id missing');
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', !!session);
      if (session) {
        setSession(session);
        // Auth state change will handle user profile fetching
      } else {
        setLoading(false);
        setIsLoading(false);
      }
    });

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const refreshUserSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session?.user) {
        const fullUser = await fetchUserProfile(session.user.id);
        if (fullUser) {
          setUser(fullUser);
          setSession(session);
        }
      }
    } catch (error) {
      console.error('Error refreshing user session:', error);
    }
  };

  const authOperations = useAuthOperations(session, user, setSession, setUser, setLoading);

  const value: AuthContextType = {
    user,
    loading: isLoading,
    isLoading,
    isAuthenticated: !!session && !!user,
    hasRoleAccess: (requiredRole: UserRole) => hasRoleAccess(user?.role, requiredRole),
    canManageUser: (targetRole: UserRole) => {
      // Convert AppUser to User type for canManageUser function
      if (!user) return false;
      const userAsUser = {
        ...user,
        createdAt: user.createdAt || new Date()
      };
      return canManageUser(userAsUser.role, targetRole);
    },
    refreshUserSession,
    ...authOperations,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
