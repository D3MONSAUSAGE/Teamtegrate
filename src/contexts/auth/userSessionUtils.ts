
import { Session } from '@supabase/supabase-js';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const createUserFromSession = async (session: Session): Promise<User> => {
  try {
    // First try to get the most up-to-date role from the database
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const dbRole = dbUser?.role as UserRole;
    const metaRole = session.user.user_metadata.role as UserRole;
    
    // Use database role if available, otherwise fall back to metadata
    const currentRole = dbRole || metaRole || 'user';

    // If the roles don't match, update the auth metadata
    if (dbRole && dbRole !== metaRole) {
      console.log(`Role mismatch detected. DB: ${dbRole}, Meta: ${metaRole}. Updating metadata.`);
      try {
        await supabase.auth.updateUser({
          data: { role: dbRole }
        });
      } catch (error) {
        console.warn('Failed to update user metadata:', error);
      }
    }

    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata.name || session.user.email?.split('@')[0] || '',
      role: currentRole,
      createdAt: new Date(session.user.created_at),
    };
  } catch (error) {
    console.error('Error creating user from session:', error);
    // Return basic user info if database call fails
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata.name || session.user.email?.split('@')[0] || '',
      role: (session.user.user_metadata.role as UserRole) || 'user',
      createdAt: new Date(session.user.created_at),
    };
  }
};

export const refreshUserSession = async (): Promise<{ session: Session | null; user: User | null }> => {
  try {
    const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error refreshing session:', error);
      return { session: null, user: null };
    }

    if (newSession) {
      const userData = await createUserFromSession(newSession);
      console.log('Session refreshed successfully, updated role:', userData.role);
      return { session: newSession, user: userData };
    }

    return { session: null, user: null };
  } catch (error) {
    console.error('Error refreshing user session:', error);
    return { session: null, user: null };
  }
};
