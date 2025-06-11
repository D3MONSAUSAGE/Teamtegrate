
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';

let debugMode = false;

export const setAuthDebugMode = (enabled: boolean) => {
  debugMode = enabled;
};

const log = (...args: any[]) => {
  if (debugMode) {
    console.log('[AuthDebug]', ...args);
  }
};

export const extractUserDataFromSession = async (session: Session): Promise<User | null> => {
  try {
    log('Extracting user data from session for user:', session.user.id);
    
    // Get user profile from our users table
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    if (!userProfile) {
      log('No user profile found, creating basic user object');
      // Fallback to session data if no profile exists
      return {
        id: session.user.id,
        email: session.user.email || '',
        role: 'user' as UserRole,
        organizationId: session.user.user_metadata?.organization_id || '', // Changed from organization_id
        name: session.user.user_metadata?.name || session.user.email || '',
        timezone: session.user.user_metadata?.timezone || 'UTC',
        createdAt: new Date(session.user.created_at),
        avatar_url: session.user.user_metadata?.avatar_url
      };
    }

    log('User profile found:', userProfile);

    // Convert to our User type
    const userData: User = {
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role as UserRole,
      organizationId: userProfile.organization_id, // Changed from organization_id
      name: userProfile.name,
      timezone: userProfile.timezone || 'UTC',
      createdAt: new Date(userProfile.created_at),
      avatar_url: userProfile.avatar_url
    };

    log('Extracted user data:', userData);
    return userData;

  } catch (error) {
    console.error('Error extracting user data from session:', error);
    return null;
  }
};
