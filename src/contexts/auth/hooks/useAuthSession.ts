
import { useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('AuthSession: Fetching profile for user:', userId);
      
      const { data: profileData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('AuthSession: Profile fetch error:', error);
        return null;
      }
      
      console.log('AuthSession: Profile data fetched:', profileData);
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

    console.log('AuthSession: Creating user from session for:', authUser.email);
    console.log('AuthSession: User metadata:', metadata);

    // Fetch complete profile from database
    const profileData = await fetchUserProfile(authUser.id);

    // Merge data, prioritizing database values over metadata
    const user: User = {
      id: authUser.id,
      email: authUser.email || '',
      name: profileData?.name || metadata.name || 'User',
      role: (profileData?.role as UserRole) || (metadata.role as UserRole) || 'user',
      organizationId: profileData?.organization_id || metadata.organization_id || null,
      avatar_url: metadata.avatar_url || profileData?.avatar_url || null,
      timezone: metadata.timezone || profileData?.timezone || null,
      createdAt: new Date(authUser.created_at),
    };

    console.log('AuthSession: Created user object:', {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role
    });

    // Validate that organizationId is present
    if (!user.organizationId) {
      console.error('AuthSession: WARNING - User has no organizationId:', user.email);
      console.error('AuthSession: Profile data:', profileData);
      console.error('AuthSession: Metadata:', metadata);
    }

    return user;
  }, [fetchUserProfile]);

  // Synchronous session update - sets session immediately
  const updateSessionSync = useCallback((newSession: Session | null) => {
    console.log('AuthSession: Setting session synchronously:', !!newSession);
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
      console.log('AuthSession: Basic user set:', basicUser.email, 'orgId:', basicUser.organizationId);
    } else {
      setUser(null);
      console.log('AuthSession: User cleared');
    }
  }, []);

  // Asynchronous profile enhancement - fetches full profile data
  const enhanceUserProfile = useCallback(async (session: Session) => {
    try {
      console.log('AuthSession: Enhancing user profile...');
      const completeUser = await createUserFromSession(session);
      setUser(completeUser);
      console.log('AuthSession: Enhanced user profile set:', completeUser.email, 'orgId:', completeUser.organizationId);
      
      // Double-check organizationId after enhancement
      if (!completeUser.organizationId) {
        console.error('AuthSession: CRITICAL - Enhanced user still has no organizationId!');
      }
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
