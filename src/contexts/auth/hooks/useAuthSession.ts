
import { useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return null;
      }
      
      return profileData;
    } catch (error) {
      console.error('AuthSession: Profile fetch failed:', error);
      return null;
    }
  }, []);

  const createUserFromSession = useCallback(async (session: Session): Promise<User> => {
    // Get basic user data from auth session
    const authUser = session.user;
    const metadata = authUser.user_metadata || {};

    // Fetch complete profile from database
    const profileData = await fetchUserProfile(authUser.id);

    // For email, prioritize auth session (handles pending confirmations)
    // For other fields, prioritize database values
    const user: User = {
      id: authUser.id,
      email: authUser.email || profileData?.email || '',
      name: profileData?.name || metadata.name || 'User',
      role: (profileData?.role as UserRole) || (metadata.role as UserRole) || 'user',
      organizationId: profileData?.organization_id || metadata.organization_id || null,
      avatar_url: metadata.avatar_url || profileData?.avatar_url || null,
      timezone: metadata.timezone || profileData?.timezone || null,
      createdAt: new Date(authUser.created_at),
    };

    return user;
  }, [fetchUserProfile]);

  // Synchronous session update - sets session immediately
  const updateSessionSync = useCallback((newSession: Session | null) => {
    setSession(newSession);
    
    if (newSession?.user) {
      // Create basic user object from session data immediately
      const authUser = newSession.user;
      const metadata = authUser.user_metadata || {};
      
      const basicUser: User = {
        id: authUser.id,
        email: authUser.email || '',
        name: metadata.name || 'User',
        role: (metadata.role as UserRole) || 'user',
        organizationId: metadata.organization_id || null,
        avatar_url: metadata.avatar_url || null,
        timezone: metadata.timezone || null,
        createdAt: new Date(authUser.created_at),
      };
      
      setUser(basicUser);
    } else {
      setUser(null);
    }
  }, []);

  // Asynchronous profile enhancement - fetches full profile data
  const enhanceUserProfile = useCallback(async (session: Session) => {
    try {
      const completeUser = await createUserFromSession(session);
      setUser(completeUser);
    } catch (error) {
      console.error('AuthSession: Profile enhancement failed:', error);
      // Don't clear the user, keep the basic version
    }
  }, [createUserFromSession]);

  // Combined update function that works in two phases with stability checks
  const updateSession = useCallback(async (newSession: Session | null) => {
    // Prevent unnecessary updates if session hasn't actually changed
    if (session === newSession) {
      return;
    }
    
    // Phase 1: Set session and basic user data synchronously
    updateSessionSync(newSession);
    
    // Phase 2: Enhance user profile asynchronously (only if session exists)
    if (newSession?.user) {
      // Use requestAnimationFrame to defer this properly
      requestAnimationFrame(() => {
        enhanceUserProfile(newSession);
      });
    }
  }, [session, updateSessionSync, enhanceUserProfile]);

  const refreshUserSession = useCallback(async (): Promise<void> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error && session) {
        await updateSession(session);
      }
    } catch (error) {
      console.error('AuthSession: Refresh error:', error);
    }
  }, [updateSession]);

  return {
    user,
    session,
    setUser,
    setSession,
    updateSession,
    refreshUserSession
  };
};
