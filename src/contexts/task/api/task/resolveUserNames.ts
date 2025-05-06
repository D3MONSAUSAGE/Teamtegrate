
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches user names for a list of user IDs
 * @param userIds Array of user IDs to fetch names for
 * @returns Map of user IDs to names
 */
export const resolveUserNames = async (userIds: string[]): Promise<Map<string, string>> => {
  const userMap = new Map<string, string>();
  
  if (!userIds || userIds.length === 0) {
    console.log('No user IDs to resolve');
    return userMap;
  }
  
  try {
    console.log('Resolving names for', userIds.length, 'users');
    
    // Filter out any invalid UUIDs before querying
    const validUserIds = userIds.filter(id => {
      return id && typeof id === 'string' && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    });
    
    if (validUserIds.length === 0) {
      console.log('No valid UUIDs to query');
      return userMap;
    }
    
    console.log('Resolving names for', validUserIds.length, 'users');
    
    // Get user data from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', validUserIds);
      
    if (error) {
      console.error('Error fetching user data:', error);
      return userMap;
    }
    
    if (data) {
      console.log(`Found ${data.length} users of ${validUserIds.length} requested`);
      
      // Build map of user IDs to names
      data.forEach(user => {
        userMap.set(user.id, user.name || user.email || 'Unknown User');
      });
    }
    
    return userMap;
  } catch (err) {
    console.error('Error resolving user names:', err);
    return userMap;
  }
};
