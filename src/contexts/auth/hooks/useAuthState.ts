
import { useState } from 'react';
import { useAuthSession } from './useAuthSession';
import { useAuthInitialization } from './useAuthInitialization';

export const useAuthState = () => {
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const {
    user,
    session,
    setUser,
    setSession,
    updateSession,
    refreshUserSession
  } = useAuthSession();

  // Create a wrapper that handles loading state properly
  const updateSessionWithLoading = async (newSession: any) => {
    console.log('AuthState: Processing session update, loading:', loading);
    
    // Always update session first
    await updateSession(newSession);
    
    // Set loading to false once we have processed the session
    // Don't wait for profile enhancement to complete
    if (loading) {
      console.log('AuthState: Setting loading to false');
      setLoading(false);
    }
  };

  // Enhanced session update that tracks profile enhancement
  const updateSessionWithProfileTracking = async (newSession: any) => {
    console.log('AuthState: Processing session with profile tracking, loading:', loading);
    
    if (newSession?.user) {
      setProfileLoading(true);
      console.log('AuthState: Profile enhancement started');
      
      // Update session synchronously first
      await updateSession(newSession);
      
      // Wait a bit for profile enhancement to complete
      setTimeout(() => {
        console.log('AuthState: Profile enhancement should be complete');
        setProfileLoading(false);
      }, 1000); // Increased timeout to ensure profile is fully loaded
    } else {
      // No session, clear everything
      await updateSession(newSession);
      setProfileLoading(false);
    }
    
    // Set loading to false once we have processed the session
    if (loading) {
      console.log('AuthState: Setting loading to false');
      setLoading(false);
    }
  };

  useAuthInitialization({ 
    updateSession: updateSessionWithProfileTracking, 
    setLoading 
  });

  // Enhanced ready state check - ensure user has all required data
  const isUserReady = !loading && !profileLoading && !!user && !!user.organizationId;

  return {
    user,
    session,
    loading,
    profileLoading,
    isReady: isUserReady,
    setUser,
    setSession,
    setLoading,
    refreshUserSession
  };
};
