
import { useState } from 'react';
import { useAuthSession } from './useAuthSession';
import { useAuthInitialization } from './useAuthInitialization';

export const useAuthState = () => {
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const {
    user,
    session,
    setUser,
    setSession,
    updateSession,
    refreshUserSession
  } = useAuthSession();

  // Enhanced session update with better debugging
  const updateSessionWithProfileTracking = async (newSession: any) => {
    console.log('AuthState: Processing session update:', {
      hasSession: !!newSession,
      hasUser: !!newSession?.user,
      userEmail: newSession?.user?.email,
      loading
    });
    
    if (newSession?.user) {
      setProfileLoading(true);
      console.log('AuthState: Starting profile enhancement for:', newSession.user.email);
      
      // Update session which will enhance profile
      await updateSession(newSession);
      
      // Allow time for profile enhancement
      setTimeout(() => {
        console.log('AuthState: Profile enhancement completed');
        setProfileLoading(false);
      }, 300);
    } else {
      // No session, clear everything
      console.log('AuthState: Clearing session and user data');
      await updateSession(newSession);
      setProfileLoading(false);
    }
    
    // Always set loading to false after processing
    if (loading) {
      console.log('AuthState: Setting main loading to false');
      setLoading(false);
    }
  };

  useAuthInitialization({ 
    updateSession: updateSessionWithProfileTracking, 
    setLoading 
  });

  // Enhanced debugging for auth state
  console.log('AuthState: Current state:', {
    loading,
    profileLoading,
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email,
    userOrgId: user?.organizationId,
    isReady: !loading && !!user && !!session
  });

  return {
    user,
    session,
    loading,
    profileLoading,
    isReady: !loading && !!user && !!session,
    setUser,
    setSession,
    setLoading,
    refreshUserSession
  };
};
