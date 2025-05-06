
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch user information from Supabase
 * @param userId The ID of the user to fetch information for
 * @returns The user's name or email, or undefined if not found
 */
export const fetchUserInfo = async (userId: string): Promise<string | undefined> => {
  if (!userId) return undefined;
  
  try {
    console.log('Fetching user info for ID:', userId);
    
    // Query the users table for the user with the given ID
    const { data: userData, error } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user info:', error);
      
      // Try another approach - sometimes the ID might be a string instead of UUID
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('users')
          .select('name, email')
          .filter('id::text', 'eq', userId)
          .single();
          
        if (fallbackError) {
          console.error('Fallback user lookup also failed:', fallbackError);
          return undefined;
        }
        
        if (fallbackData) {
          console.log('Found user via fallback method:', fallbackData.name || fallbackData.email);
          return fallbackData.name || fallbackData.email;
        }
      } catch (fallbackError) {
        console.error('Exception in fallback user lookup:', fallbackError);
      }
      
      return undefined;
    }
    
    if (userData) {
      // Return the user's name if available, otherwise return their email
      const result = userData.name || userData.email;
      console.log('Found user:', result);
      return result;
    } else {
      console.log('No user data found for ID:', userId);
    }
  } catch (error) {
    console.error('Exception in fetchUserInfo:', error);
  }
  
  return undefined;
};
