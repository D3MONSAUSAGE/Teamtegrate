
import React, { createContext, useContext, ReactNode } from 'react';
import { AuthContextType } from './types';
import { useAuthOperations } from './hooks/useAuthOperations';
import { useAuthState } from './hooks/useAuthState';
import { useRoleAccess } from './hooks/useRoleAccess';
import { testRLSPolicies } from './utils/rlsHelpers';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🚀 AuthProvider: Initializing');

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

  console.log('📊 AuthProvider: Current state', {
    loading,
    hasUser: !!user,
    isAuthenticated,
    userEmail: user?.email,
    organizationId: user?.organizationId,
    sessionExists: !!session,
    sessionUserId: session?.user?.id,
    sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A'
  });

  // Enhanced debug logging for auth provider state changes
  React.useEffect(() => {
    console.log('🔄 AuthProvider: State change detected:', {
      timestamp: new Date().toISOString(),
      loading,
      user: user ? {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role
      } : null,
      session: session ? {
        userId: session.user?.id,
        hasAccessToken: !!session.access_token,
        expiresAt: session.expires_at
      } : null,
      isAuthenticated
    });
  }, [loading, user, session, isAuthenticated]);

  // Test RLS policies when user is authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔍 User authenticated, testing RLS policies...');
      testRLSPolicies().then(result => {
        if (result.success) {
          console.log('✅ RLS policies working correctly:', result);
        } else {
          console.error('❌ RLS policies have issues:', result.error);
        }
      });
    }
  }, [isAuthenticated, user?.id]);

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
