
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

  const refreshUserSession = async (): Promise<void> => {
    const { session: newSession, user: userData } = await refreshSession();
    if (newSession && userData) {
      setSession(newSession);
      setUser(userData);
    }
  };

  // Handle user data creation after session is set
  const handleUserCreation = async (session: Session | null) => {
    try {
      if (session?.user) {
        console.log('Creating user data for session:', session.user.id);
        const userData = await createUserFromSession(session);
        setUser(userData);
        console.log('User data created successfully:', userData.id, userData.role);
      } else {
        setUser(null);
        console.log('No session, clearing user data');
      }
    } catch (error) {
      console.error('Error creating user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    console.log('Checking for existing session...');
    
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        console.log('Initial session check:', session?.user?.id || 'no session');
        setSession(session);
        await handleUserCreation(session);
      } catch (error) {
        console.error('Error in initial session check:', error);
        setLoading(false);
      }
    };

    getInitialSession();
  }, []);

  // Set up auth state listener
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        await handleUserCreation(session);
      }
    );

    return () => {
      console.log('Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, []);

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
    } catch (error) {
      setUser(null);
      setSession(null);
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
    isAuthenticated: !!user,
    hasRoleAccess: (requiredRole: any) => hasRoleAccess(user?.role, requiredRole),
    canManageUser: (targetRole: any) => canManageUser(user?.role, targetRole),
    refreshUserSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
