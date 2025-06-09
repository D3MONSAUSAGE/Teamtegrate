
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { AuthContextType } from './auth/types';
import { hasRoleAccess, canManageUser } from './auth/roleUtils';
import { createUserFromSession, refreshUserSession as refreshSession } from './auth/userSessionUtils';
import { login as authLogin, signup as authSignup, logout as authLogout, updateUserProfile as updateProfile } from './auth/authOperations';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Create user data from session - only when needed
  const handleUserCreation = async (session: Session | null, forceCreate: boolean = false) => {
    try {
      if (session?.user && forceCreate) {
        console.log('Creating user data for:', session.user.id);
        const userData = await createUserFromSession(session);
        setUser(userData);
        console.log('User data created successfully:', userData.id, userData.role);
      } else if (!session) {
        setUser(null);
        console.log('No session, clearing user data');
      }
    } catch (error) {
      console.error('Error creating user data:', error);
      // Don't force reset on user creation errors, just clear user data
      setUser(null);
    }
  };

  // Initialize auth - simplified for faster loading
  useEffect(() => {
    let mounted = true;
    let initTimeout: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      console.log('Initializing auth...');
      setLoading(true);
      
      try {
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        }
        
        console.log('Initial session:', currentSession?.user?.id || 'no session');
        
        if (mounted) {
          setSession(currentSession);
          // For landing page, we don't need to create user data immediately
          // Only set basic session state and let the app decide when to load user data
          if (currentSession) {
            // Create a basic user object without database calls
            const basicUser: User = {
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              name: currentSession.user.user_metadata.name || currentSession.user.email?.split('@')[0] || '',
              role: (currentSession.user.user_metadata.role as any) || 'user',
              createdAt: new Date(currentSession.user.created_at),
            };
            setUser(basicUser);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Set timeout to prevent infinite loading
    initTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timeout, setting loading to false');
        setLoading(false);
      }
    }, 3000);

    initializeAuth();
    
    return () => {
      mounted = false;
      if (initTimeout) clearTimeout(initTimeout);
    };
  }, []);

  // Set up auth state listener
  useEffect(() => {
    console.log('Setting up auth listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        
        // Create basic user object immediately
        const basicUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || '',
          role: (session.user.user_metadata.role as any) || 'user',
          createdAt: new Date(session.user.created_at),
        };
        setUser(basicUser);
        setLoading(false);
        
        // Only create database user record after successful login (not during initialization)
        if (event === 'SIGNED_IN') {
          setTimeout(() => {
            handleUserCreation(session, true);
          }, 100);
        }
      }
    );

    return () => {
      console.log('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const refreshUserSession = async (): Promise<void> => {
    try {
      const { session: newSession, user: userData } = await refreshSession();
      if (newSession && userData) {
        setSession(newSession);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      // Don't force reset on refresh errors
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authLogin(email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: any) => {
    setLoading(true);
    try {
      await authSignup(email, password, name, role);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authLogout(!!session);
      setSession(null);
      setUser(null);
    } catch (error) {
      // Still clear local state even if logout fails
      setSession(null);
      setUser(null);
      throw error;
    }
  };
  
  const updateUserProfile = async (data: { name?: string }) => {
    try {
      await updateProfile(data);
      
      if (user) {
        setUser({
          ...user,
          name: data.name || user.name,
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isLoading: loading,
    login,
    signup,
    logout,
    updateUserProfile,
    isAuthenticated: !!user && !!session,
    hasRoleAccess: (requiredRole: any) => hasRoleAccess(user?.role, requiredRole),
    canManageUser: (targetRole: any) => canManageUser(user?.role, targetRole),
    refreshUserSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
