
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

  // Wrap updateSession to handle loading state
  const updateSessionWithLoading = async (newSession: any) => {
    await updateSession(newSession);
    // Set loading to false after session is updated (successful login/logout)
    setLoading(false);
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
