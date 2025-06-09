
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
  const [authReady, setAuthReady] = useState(false);

  // Force complete session reset
  const forceSessionReset = async () => {
    console.log('Force resetting all session data...');
    setUser(null);
    setSession(null);
    
    // Clear all possible auth data
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear IndexedDB auth data if it exists
    try {
      if (window.indexedDB) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name?.includes('supabase')) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      }
    } catch (error) {
      console.warn('Could not clear IndexedDB:', error);
    }

    // Sign out from Supabase to clear server session
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Error during signout:', error);
    }
  };

  // Validate session health
  const validateSessionHealth = async (session: Session | null): Promise<boolean> => {
    if (!session) return false;
    
    try {
      // Test if auth.uid() works by making a simple RPC call
      const { data, error } = await supabase.rpc('get_user_role');
      
      if (error) {
        console.error('Session validation failed:', error);
        if (error.message.includes('JWT') || error.message.includes('auth')) {
          await forceSessionReset();
          return false;
        }
      }
      
      return !error;
    } catch (error) {
      console.error('Session health check failed:', error);
      await forceSessionReset();
      return false;
    }
  };

  // Create user data from session
  const handleUserCreation = async (session: Session | null) => {
    try {
      if (session?.user) {
        console.log('Creating user data for:', session.user.id);
        
        // Validate session first
        const isHealthy = await validateSessionHealth(session);
        if (!isHealthy) {
          console.log('Session is not healthy, clearing data');
          setUser(null);
          setSession(null);
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
      await forceSessionReset();
    }
  };

  // Initialize auth
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      console.log('Initializing auth...');
      setLoading(true);
      
      try {
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          if (error.message.includes('Invalid Refresh Token')) {
            await forceSessionReset();
          }
          if (mounted) {
            setLoading(false);
            setAuthReady(true);
          }
          return;
        }
        
        console.log('Initial session:', currentSession?.user?.id || 'no session');
        
        if (mounted) {
          setSession(currentSession);
          await handleUserCreation(currentSession);
          setAuthReady(true);
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
        if (mounted) {
          await forceSessionReset();
          setAuthReady(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();
    
    return () => {
      mounted = false;
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
        await handleUserCreation(session);
        setLoading(false);
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
        const isHealthy = await validateSessionHealth(newSession);
        if (isHealthy) {
          setSession(newSession);
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      await forceSessionReset();
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
      await forceSessionReset();
    } catch (error) {
      await forceSessionReset();
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
    loading: loading || !authReady,
    isLoading: loading || !authReady,
    login,
    signup,
    logout,
    updateUserProfile,
    isAuthenticated: !!user && !!session && authReady,
    hasRoleAccess: (requiredRole: any) => hasRoleAccess(user?.role, requiredRole),
    canManageUser: (targetRole: any) => canManageUser(user?.role, targetRole),
    refreshUserSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
