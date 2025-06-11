
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from '@/types';

export const createBasicUserFromSession = (sessionUser: SupabaseUser): User => {
  return {
    id: sessionUser.id,
    email: sessionUser.email || '',
    name: sessionUser.user_metadata.name || sessionUser.email?.split('@')[0] || '',
    role: (sessionUser.user_metadata.role as UserRole) || 'user',
    organization_id: '', // Will be filled from database
    createdAt: new Date(sessionUser.created_at || Date.now()),
    avatar_url: sessionUser.user_metadata.avatar_url,
    timezone: sessionUser.user_metadata.timezone
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
