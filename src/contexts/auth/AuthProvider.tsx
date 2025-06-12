
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
  console.log('🚀 AuthProvider: Initializing with DETAILED debugging');

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

  console.log('📊 AuthProvider: DETAILED current state:', {
    loading,
    hasUser: !!user,
    isAuthenticated,
    userEmail: user?.email,
    userId: user?.id,
    organizationId: user?.organizationId,
    userRole: user?.role,
    sessionExists: !!session,
    sessionUserId: session?.user?.id,
    sessionUserEmail: session?.user?.email,
    sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A',
    sessionValid: session?.expires_at ? new Date(session.expires_at * 1000) > new Date() : false
  });

  // Enhanced debug logging for auth provider state changes
  React.useEffect(() => {
    console.log('🔄 AuthProvider: DETAILED state change detected:', {
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
        accessTokenLength: session.access_token?.length || 0,
        expiresAt: session.expires_at,
        expiresAtDate: session.expires_at ? new Date(session.expires_at * 1000) : 'N/A',
        isValid: session.expires_at ? new Date(session.expires_at * 1000) > new Date() : false
      } : null,
      isAuthenticated,
      hasRoleAccess: typeof hasRoleAccess === 'function' ? 'FUNCTION' : hasRoleAccess,
      canManageUser: typeof canManageUser === 'function' ? 'FUNCTION' : canManageUser
    });
  }, [loading, user, session, isAuthenticated]);

  // Only test RLS policies when user is authenticated and we're sure auth is working
  // Don't run this for public page visitors
  React.useEffect(() => {
    if (isAuthenticated && user && user.organizationId) {
      console.log('🔍 DETAILED RLS TESTING: User authenticated, testing policies...');
      console.log('🔍 User details for RLS test:', {
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role
      });
      
      testRLSPolicies().then(result => {
        if (result.success) {
          console.log('✅ DETAILED RLS TEST SUCCESS:', result);
        } else {
          console.error('❌ DETAILED RLS TEST FAILURE:', result.error);
        }
      }).catch(error => {
        console.error('❌ RLS test promise rejection:', error);
      });
    } else {
      console.log('🔍 RLS TESTING: Skipping - user not authenticated or missing data:', {
        isAuthenticated,
        hasUser: !!user,
        userOrgId: user?.organizationId,
        reason: !isAuthenticated ? 'not authenticated' : !user ? 'no user' : 'no org id'
      });
    }
  }, [isAuthenticated, user?.id, user?.organizationId]);

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
