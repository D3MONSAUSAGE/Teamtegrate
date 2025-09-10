
import { useState } from 'react';
import { useAuthSession } from './useAuthSession';
import { useAuthInitialization } from './useAuthInitialization';
import { validateUUID } from '@/utils/uuidValidation';

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
      
      // Allow time for profile enhancement - Safari needs extra time
      const delay = (typeof window !== 'undefined' && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) ? 400 : 300;
      setTimeout(() => {
        console.log('AuthState: Profile enhancement completed');
        setProfileLoading(false);
      }, delay);
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
  const hasValidOrgId = !!validateUUID(user?.organizationId);
  const isReady = !loading && !!user && !!session && hasValidOrgId;
  console.log('AuthState: Current state:', {
    loading,
    profileLoading,
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email,
    userOrgId: user?.organizationId,
    hasValidOrgId,
    isReady
  });

  return {
    user,
    session,
    loading,
    profileLoading,
    isReady,
    setUser,
    setSession,
    setLoading,
    refreshUserSession
  };
};
