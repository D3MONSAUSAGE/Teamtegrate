
import { useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const createUserFromSession = useCallback((session: Session): User => {
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || 'User',
      role: (session.user.user_metadata?.role as UserRole) || 'user',
      organizationId: session.user.user_metadata?.organization_id || null,
      avatar_url: session.user.user_metadata?.avatar_url || null,
      timezone: session.user.user_metadata?.timezone || null,
      createdAt: new Date(session.user.created_at),
    };
  }, []);

  const updateSession = useCallback((newSession: Session | null) => {
    setSession(newSession);
    if (newSession?.user) {
      const basicUser = createUserFromSession(newSession);
      setUser(basicUser);
    } else {
      setUser(null);
    }
  }, [createUserFromSession]);

  const refreshUserSession = useCallback(async (): Promise<void> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error && session) {
        updateSession(session);
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
