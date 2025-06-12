
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User as AppUser, UserRole } from '@/types';
import { AuthContextType } from './types';
import { useAuthOperations } from './hooks/useAuthOperations';
import { useAuthSession } from './hooks/useAuthSession';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('AuthProvider: Initializing');

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

  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    console.log('AuthProvider: Refreshing user');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userProfile = await fetchUserProfile(session.user.id);
      setUser(userProfile);
    } else {
      setUser(null);
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
    
    console.log('AuthProvider: Setting up auth listener');
    
    const initializeAuth = async () => {
      try {
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

    initializeAuth();

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

    return () => {
      isMounted = false;
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  // Get auth operations
  const {
    login,
    signup,
    logout,
    updateUserProfile
  } = useAuthOperations(session, user, setSession, setUser, setLoading);

  const isAuthenticated = !!user && !!session;
  const isLoading = loading;

  // Role-based access control helpers
  const hasRoleAccess = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      'user': 1,
      'manager': 2,
      'admin': 3,
      'superadmin': 4
    };
    
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requiredRole];
    
    return userLevel >= requiredLevel;
  };

  const canManageUser = (targetRole: UserRole): boolean => {
    if (!user) return false;
    
    if (user.role === 'superadmin') return true;
    if (user.role === 'admin' && ['manager', 'user'].includes(targetRole)) return true;
    if (user.role === 'manager' && targetRole === 'user') return true;
    
    return false;
  };

  console.log('AuthProvider: Current state - loading:', loading, 'user:', !!user, 'isAuthenticated:', isAuthenticated);

  const value: AuthContextType = {
    user,
    loading,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated,
    updateUserProfile,
    hasRoleAccess,
    canManageUser,
    refreshUserSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
