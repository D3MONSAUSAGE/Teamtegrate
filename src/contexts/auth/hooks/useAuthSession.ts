
import { useEffect, useState } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { AppUser } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { createUserFromSession, refreshUserSession as refreshSession } from '../userSessionUtils';

export const useAuthSession = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Create user data from session - only when needed
  const handleUserCreation = async (session: Session | null, forceCreate: boolean = false) => {
    try {
      if (session?.user && forceCreate) {
        console.log('Creating user data for:', session.user.id);
        const userData = await createUserFromSession(session);
        // Convert User to AppUser by excluding createdAt
        const appUser: AppUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          avatar_url: userData.avatar_url,
          organization_id: userData.organization_id
        };
        setUser(appUser);
        console.log('User data created successfully:', appUser.id, appUser.role);
      } else if (!session) {
        setUser(null);
        console.log('No session, clearing user data');
      }
    } catch (error) {
      console.error('Error creating user data:', error);
      // Don't force reset on user creation errors, just clear user data
      setUser(null);
    }
  };

  const refreshUserSession = async (): Promise<void> => {
    try {
      const { session: newSession, user: userData } = await refreshSession();
      if (newSession && userData) {
        setSession(newSession);
        // Convert User to AppUser
        const appUser: AppUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          avatar_url: userData.avatar_url,
          organization_id: userData.organization_id
        };
        setUser(appUser);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      // Don't force reset on refresh errors
    }
  };

  return {
    user,
    session,
    loading,
    setUser,
    setSession,
    setLoading,
    handleUserCreation,
    refreshUserSession
  };
};
