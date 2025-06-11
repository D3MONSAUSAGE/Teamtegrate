
import React, { createContext, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType } from './types';
import { AppUser, UserRole, User } from '@/types';
import { hasRoleAccess, canManageUser } from './roleUtils';
import { useAuthSession } from './hooks/useAuthSession';
import { useAuthOperations } from './hooks/useAuthOperations';
import { createBasicUserFromSession, setupAuthTimeout } from './utils/authHelpers';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to convert AppUser to User, ensuring createdAt is present
const toFullUser = (appUser: AppUser): User => {
  return {
    ...appUser,
    createdAt: appUser.createdAt ?? new Date()
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    session,
    loading,
    setUser,
    setSession,
    setLoading,
    handleUserCreation,
    refreshUserSession
  } = useAuthSession();

  const {
    login,
    signup,
    logout,
    updateUserProfile
  } = useAuthOperations(session, user, setSession, setUser, setLoading);

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
            const basicUser = createBasicUserFromSession(currentSession.user);
            // Ensure createdAt is set for AppUser compatibility - provide default value
            const userWithCreatedAt: AppUser = {
              ...basicUser,
              createdAt: basicUser.createdAt || new Date()
            };
            setUser(userWithCreatedAt);
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
    initTimeout = setupAuthTimeout(loading, setLoading);

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
        const basicUser = createBasicUserFromSession(session.user);
        // Ensure createdAt is set for AppUser compatibility - provide default value
        const userWithCreatedAt: AppUser = {
          ...basicUser,
          createdAt: basicUser.createdAt || new Date()
        };
        setUser(userWithCreatedAt);
        setLoading(false);
        
        // Only create database user record after successful login (not during initialization)
        if (event === 'SIGNED_IN') {
          setTimeout(() => {
            // Convert AppUser to User and pass to handleUserCreation
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

  const value = {
    user,
    loading,
    isLoading: loading,
    login,
    signup,
    logout,
    updateUserProfile,
    isAuthenticated: !!user && !!session,
    hasRoleAccess: (requiredRole: UserRole) => hasRoleAccess(user?.role as UserRole, requiredRole),
    canManageUser: (targetRole: UserRole) => canManageUser(user?.role as UserRole, targetRole),
    refreshUserSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
