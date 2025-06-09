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
  const [initialCheckDone, setInitialCheckDone] = useState(false);

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
      if (!initialCheckDone) {
        setInitialCheckDone(true);
        setLoading(false);
        console.log('Initial auth check completed');
      }
    }
  };

  // Check for existing session on mount with improved error handling
  useEffect(() => {
    console.log('Checking for existing session...');
    
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          // Force a session refresh if there's an error
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Error refreshing session:', refreshError);
          } else {
            console.log('Session refreshed successfully');
            setSession(refreshData.session);
            setTimeout(() => handleUserCreation(refreshData.session), 0);
            return;
          }
        } else {
          console.log('Initial session check:', session?.user?.id || 'no session');
          setSession(session);
          // Defer user creation to prevent blocking
          setTimeout(() => handleUserCreation(session), 0);
        }
      } catch (error) {
        console.error('Error in initial session check:', error);
        setLoading(false);
        setInitialCheckDone(true);
      }
    };

    checkSession();
  }, []);

  // Set up auth state listener for session changes with better session handling
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        // Validate session before using it
        if (session) {
          // Test the session by making a simple authenticated query
          try {
            const { data, error } = await supabase.from('users').select('id').limit(1);
            if (error && error.message.includes('JWT')) {
              console.error('Session appears invalid, refreshing...');
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              if (!refreshError && refreshData.session) {
                setSession(refreshData.session);
                setTimeout(() => handleUserCreation(refreshData.session), 0);
                return;
              }
            }
          } catch (testError) {
            console.error('Session validation failed:', testError);
          }
        }
        
        // Only handle synchronous operations in the callback
        setSession(session);
        
        // Defer user creation to prevent deadlocks
        setTimeout(() => {
          handleUserCreation(session);
        }, 0);
        
        // Clear loading state for auth events after initial check
        if (initialCheckDone) {
          setLoading(false);
          console.log('Auth state loading cleared');
        }
      }
    );

    return () => {
      console.log('Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [initialCheckDone]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authLogin(email, password);
      // Force session refresh after login to ensure DB connectivity
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Post-login session verification successful');
        }
      }, 1000);
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
