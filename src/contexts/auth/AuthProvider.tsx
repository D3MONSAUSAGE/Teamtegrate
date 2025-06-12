
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
  console.log('🚀 AuthProvider: Initializing with improved error handling');

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

  console.log('📊 AuthProvider: Current state:', {
    loading,
    hasUser: !!user,
    isAuthenticated,
    userEmail: user?.email,
    userId: user?.id,
    organizationId: user?.organizationId,
    userRole: user?.role,
    sessionExists: !!session,
    sessionValid: session?.expires_at ? new Date(session.expires_at * 1000) > new Date() : false
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
        role: user.role,
        name: user.name
      } : null,
      session: session ? {
        userId: session.user?.id,
        userEmail: session.user?.email,
        hasAccessToken: !!session.access_token,
        isValid: session.expires_at ? new Date(session.expires_at * 1000) > new Date() : false
      } : null,
      isAuthenticated
    });
  }, [loading, user, session, isAuthenticated]);

  // Simplified RLS testing - only run when user is fully authenticated and stable
  React.useEffect(() => {
    if (isAuthenticated && user && user.organizationId && !loading) {
      // Add delay to ensure auth is stable
      const testTimeout = setTimeout(() => {
        console.log('🔍 RLS TESTING: User fully authenticated, testing policies...');
        
        testRLSPolicies().then(result => {
          if (result.success) {
            console.log('✅ RLS TEST SUCCESS:', result);
          } else {
            console.error('❌ RLS TEST FAILURE:', result.error);
          }
        }).catch(error => {
          console.error('❌ RLS test promise rejection:', error);
        });
      }, 2000); // 2 second delay

      return () => clearTimeout(testTimeout);
    } else {
      console.log('🔍 RLS TESTING: Skipping - conditions not met:', {
        isAuthenticated,
        hasUser: !!user,
        userOrgId: user?.organizationId,
        loading
      });
    }
  }, [isAuthenticated, user?.id, user?.organizationId, loading]);

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
