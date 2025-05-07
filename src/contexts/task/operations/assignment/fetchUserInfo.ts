
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch user information from Supabase
 * @param userId The ID of the user to fetch information for
 * @returns The user's name or email, or undefined if not found
 */
export const fetchUserInfo = async (userId: string): Promise<string | undefined> => {
  if (!userId) return undefined;
  
  try {
    // Query the users table for the user with the given ID
    const { data: userData, error } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching user info:', error);
      return undefined;
    }
    
    if (userData) {
      // Return the user's name if available, otherwise return their email
      const displayName = userData.name || userData.email;
      console.log(`Found user info for ${userId}: ${displayName}`);
      return displayName;
    } else {
      console.log(`No user found with ID: ${userId}`);
    }
  } catch (error) {
    console.error('Exception in fetchUserInfo:', error);
  }
  
  return undefined;
};
