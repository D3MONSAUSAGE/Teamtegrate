
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

  // Clear corrupted session data
  const clearSession = () => {
    console.log('Clearing corrupted session data');
    setUser(null);
    setSession(null);
    localStorage.removeItem('sb-zlfpiovyodiyecdueiig-auth-token');
    // Clear any other potential session storage
    sessionStorage.clear();
  };

  // Validate session by checking if auth.uid() works
  const validateSession = async (currentSession: Session): Promise<boolean> => {
    try {
      // Test if we can make an authenticated request
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', currentSession.user.id)
        .single();
      
      if (error) {
        console.error('Session validation failed:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  };

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
        console.log('Processing session for user:', session.user.id);
        
        // Validate the session first
        const isValid = await validateSession(session);
        if (!isValid) {
          console.log('Session is invalid, clearing...');
          clearSession();
          setLoading(false);
          return;
        }
        
        const userData = await createUserFromSession(session);
        setUser(userData);
        console.log('User data created successfully:', userData.id, userData.role);
      } else {
        setUser(null);
        console.log('No session, clearing user data');
      }
    } catch (error) {
      console.error('Error creating user data:', error);
      // If we get an error, the session might be corrupted
      clearSession();
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
          if (error.message.includes('Invalid Refresh Token')) {
            console.log('Detected invalid refresh token, clearing session');
            clearSession();
          }
          setLoading(false);
          return;
        }
        
        console.log('Initial session check:', session?.user?.id || 'no session');
        setSession(session);
        await handleUserCreation(session);
      } catch (error) {
        console.error('Error in initial session check:', error);
        clearSession();
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
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
        
        if (event === 'SIGNED_OUT' || !session) {
          clearSession();
          setLoading(false);
          return;
        }
        
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
      clearSession();
    } catch (error) {
      // Force clear session even if logout fails
      clearSession();
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
