
import { User } from '@supabase/supabase-js';
import { User as AppUser } from '@/types';

export const createBasicUserFromSession = (sessionUser: User): AppUser => {
  return {
    id: sessionUser.id,
    email: sessionUser.email || '',
    name: sessionUser.user_metadata.name || sessionUser.email?.split('@')[0] || '',
    role: (sessionUser.user_metadata.role as any) || 'user',
    createdAt: new Date(sessionUser.created_at),
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
