
import { User as SupabaseUser } from '@supabase/supabase-js';
import { AppUser, UserRole } from '@/types';

export const createBasicUserFromSession = (sessionUser: SupabaseUser): AppUser => {
  return {
    id: sessionUser.id,
    email: sessionUser.email || '',
    name: sessionUser.user_metadata.name || sessionUser.email?.split('@')[0] || '',
    role: (sessionUser.user_metadata.role as UserRole) || 'user',
    // Don't include organization_id here as it requires a database call
  };
};

export const setupAuthTimeout = (loading: boolean, setLoading: (loading: boolean) => void, timeoutMs: number = 3000) => {
  const timeout = setTimeout(() => {
    if (loading) {
      console.warn('Auth initialization timeout, setting loading to false');
      setLoading(false);
    }
  }, timeoutMs);

  return timeout;
};
