
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
        console.error('AuthSession: Profile fetch error:', error);
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

    // Merge data, prioritizing database values over metadata
    return {
      id: authUser.id,
      email: authUser.email || '',
      name: profileData?.name || metadata.name || 'User',
      role: (profileData?.role as UserRole) || (metadata.role as UserRole) || 'user',
      organizationId: profileData?.organization_id || metadata.organization_id || '',
      avatar_url: metadata.avatar_url || profileData?.avatar_url || null,
      timezone: metadata.timezone || profileData?.timezone || null,
      createdAt: new Date(authUser.created_at),
    };
  }, [fetchUserProfile]);

  const updateSession = useCallback(async (newSession: Session | null) => {
    setSession(newSession);
    if (newSession?.user) {
      const completeUser = await createUserFromSession(newSession);
      setUser(completeUser);
    } else {
      setUser(null);
    }
  }, [createUserFromSession]);

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
