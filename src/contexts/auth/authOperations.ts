import { UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Session } from '@supabase/supabase-js';
import { createUserFromSession } from './userSessionUtils';
import { User } from '@/types';

export const login = async (email: string, password: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error logging in:', error);
    toast.error(error.message || 'Error logging in');
    throw error;
  }
};

export const signup = async (email: string, password: string, name: string, role: UserRole): Promise<void> => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
      emailRedirectTo: window.location.origin + '/dashboard',
    }
  });

  if (error) {
    console.error('Error signing up:', error);
    toast.error(error.message || 'Error creating account');
    throw error;
  }
  
  toast.success('Account created successfully! Please check your email for verification.');
};

export const logout = async (hasSession: boolean): Promise<void> => {
  if (!hasSession) {
    console.log('No active session found, clearing local state only');
    return;
  }
  
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error logging out:', error);
    toast.error('Error logging out. Your local session has been cleared.');
    throw error;
  }
};

export const updateUserProfile = async (data: { name?: string }): Promise<void> => {
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  
  if (!currentSession) {
    throw new Error('No active session found. Please log in again.');
  }

  const { error } = await supabase.auth.updateUser({
    data: data
  });

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const initializeUserTimezone = async (userId: string): Promise<void> => {
  try {
    // Check if user already has a timezone set
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('timezone')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error checking user timezone:', fetchError);
      return;
    }

    // If timezone is not set, detect and set it
    if (!existingUser.timezone || existingUser.timezone === 'UTC') {
      try {
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ timezone: detectedTimezone })
          .eq('id', userId);

        if (updateError) {
          console.error('Error setting initial timezone:', updateError);
        } else {
          console.log(`Set initial timezone for user ${userId}: ${detectedTimezone}`);
        }
      } catch (timezoneError) {
        console.warn('Could not detect timezone, keeping UTC default:', timezoneError);
      }
    }
  } catch (error) {
    console.error('Error in initializeUserTimezone:', error);
  }
};

export const handleAuthStateChange = async (session: Session | null): Promise<User | null> => {
  if (session) {
    const userData = await createUserFromSession(session);
    
    // Initialize timezone for new or existing users
    await initializeUserTimezone(session.user.id);
    
    return userData;
  }
  return null;
};
