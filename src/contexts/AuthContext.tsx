
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

  // Set up auth state listener - this handles ALL authentication state changes
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        try {
          setSession(session);
          if (session?.user) {
            const userData = await createUserFromSession(session);
            setUser(userData);
            console.log('User authenticated:', userData.id, userData.role);
          } else {
            setUser(null);
            console.log('User logged out or no session');
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setUser(null);
          setSession(null);
        } finally {
          // Always clear loading state after handling auth state change
          setLoading(false);
          console.log('Loading state cleared');
        }
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
      // Don't set loading to false here - let onAuthStateChange handle it
    } catch (error) {
      setLoading(false); // Only set to false on error
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: any) => {
    setLoading(true);
    try {
      await authSignup(email, password, name, role);
      // Don't set loading to false here - let onAuthStateChange handle it
    } catch (error) {
      setLoading(false); // Only set to false on error
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authLogout(!!session);
      // Don't manually clear state here - let onAuthStateChange handle it
    } catch (error) {
      // On error, clear state manually as fallback
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
