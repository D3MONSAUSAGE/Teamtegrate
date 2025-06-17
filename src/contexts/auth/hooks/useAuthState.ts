
import { useState } from 'react';
import { useAuthSession } from './useAuthSession';
import { useAuthInitialization } from './useAuthInitialization';

export const useAuthState = () => {
  const [loading, setLoading] = useState(true);

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

  useAuthInitialization({ 
    updateSession: updateSessionWithLoading, 
    setLoading 
  });

  return {
    user,
    session,
    loading,
    setUser,
    setSession,
    setLoading,
    refreshUserSession
  };
};
