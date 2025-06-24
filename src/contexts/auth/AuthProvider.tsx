
import React, { createContext, useContext, ReactNode } from 'react';
import { AuthContextType } from './types';
import { useAuthOperations } from './hooks/useAuthOperations';
import { useAuthState } from './hooks/useAuthState';
import { useRoleAccess } from './hooks/useRoleAccess';
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('AuthProvider: Initializing');

  return (
    <AuthErrorBoundary>
      <AuthProviderInner>
        {children}
      </AuthProviderInner>
    </AuthErrorBoundary>
  );
};

const AuthProviderInner: React.FC<AuthProviderProps> = ({ children }) => {
  const {
    user,
    session,
    loading,
    profileLoading,
    isReady,
    setUser,
    setSession,
    setLoading,
    refreshUserSession
  } = useAuthState();

  const { hasRoleAccess, canManageUser } = useRoleAccess(user);

  // Get auth operations with error handling
  const {
    login,
    signup,
    logout,
    updateUserProfile
  } = useAuthOperations(session, user, setSession, setUser, setLoading);

  const isAuthenticated = !!user && !!session;

  console.log('AuthProvider: Current state - loading:', loading, 'profileLoading:', profileLoading, 'user:', !!user, 'isAuthenticated:', isAuthenticated, 'isReady:', isReady);

  // Add null check for safety
  const value: AuthContextType = {
    user: user || null,
    loading,
    isLoading: loading,
    profileLoading,
    isReady,
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
