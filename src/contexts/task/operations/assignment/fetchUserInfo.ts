
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch user information from Supabase
 * @param userId The ID of the user to fetch information for
 * @returns The user's name or email, or undefined if not found
 */
export const fetchUserInfo = async (userId: string): Promise<string | undefined> => {
  if (!userId) return undefined;
  
  // Validate UUID format before sending to database
  const isValidUuid = (id: string) => {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(id);
  };

  if (!isValidUuid(userId)) {
    console.error('Invalid UUID format in fetchUserInfo:', userId);
    return undefined;
  }
  
  try {
    // Query the users table for the user with the given ID
    const { data: userData, error } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user info:', error);
      return undefined;
    }
    
    if (userData) {
      // Return the user's name if available, otherwise return their email
      return userData.name || userData.email;
    }
  } catch (error) {
    console.error('Exception in fetchUserInfo:', error);
  }
  
  return undefined;
};
