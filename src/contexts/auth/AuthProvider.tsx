
import React, { createContext, useContext, ReactNode } from 'react';
import { AuthContextType } from './types';
import { useAuthOperations } from './hooks/useAuthOperations';
import { useAuthState } from './hooks/useAuthState';
import { useRoleAccess } from './hooks/useRoleAccess';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('AuthProvider: Initializing');

  const {
    user,
    session,
    loading,
    setUser,
    setSession,
    setLoading,
    refreshUserSession
  } = useAuthState();

  const { hasRoleAccess, canManageUser } = useRoleAccess(user);

  // Get auth operations
  const {
    login,
    signup,
    logout,
    updateUserProfile
  } = useAuthOperations(session, user, setSession, setUser, setLoading);

  const isAuthenticated = !!user && !!session;

  console.log('AuthProvider: Current state - loading:', loading, 'user:', !!user, 'isAuthenticated:', isAuthenticated);

  const value: AuthContextType = {
    user,
    loading,
    isLoading: loading,
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
