
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

  return (
    <AuthProviderInner>
      {children}
    </AuthProviderInner>
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
    login: async (email: string, password: string) => {
      try {
        await login(email, password);
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    signup: async (email: string, password: string, name: string, organizationType?: string, organizationName?: string, inviteCode?: string) => {
      try {
        const organizationData = organizationType === 'create' 
          ? { type: 'create' as const, organizationName }
          : organizationType === 'join'
          ? { type: 'join' as const, inviteCode }
          : undefined;
        
        await signup(email, password, name, 'user', organizationData);
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    logout,
    isAuthenticated,
    updateUserProfile,
    hasRoleAccess,
    canManageUser: (targetUser) => canManageUser(targetUser.role),
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
