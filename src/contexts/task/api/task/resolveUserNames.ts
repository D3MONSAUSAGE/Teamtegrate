
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
    console.log('Resolving names for', userIds.length, 'users. IDs:', userIds);
    
    // Normalize user IDs to handle both string and UUID formats
    const normalizedUserIds = userIds.map(id => {
      // Convert to string if not already
      return typeof id === 'string' ? id : String(id);
    });
    
    // Filter out any invalid UUIDs before querying
    const validUserIds = normalizedUserIds.filter(id => {
      const isValid = id && typeof id === 'string' && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (!isValid) {
        console.warn(`Skipping invalid user ID: "${id}"`);
      }
      
      return isValid;
    });
    
    if (validUserIds.length === 0) {
      console.warn('No valid UUIDs to query after filtering');
      return userMap;
    }
    
    console.log('Querying for', validUserIds.length, 'valid user IDs:', validUserIds);
    
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
        const displayName = user.name || user.email || 'Unknown User';
        userMap.set(user.id, displayName);
        console.log(`Mapped user ${user.id} to name "${displayName}"`);
      });
    }
    
    return userMap;
  } catch (err) {
    console.error('Error resolving user names:', err);
    return userMap;
  }
};
