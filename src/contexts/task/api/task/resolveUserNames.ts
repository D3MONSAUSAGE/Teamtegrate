import { supabase } from '@/integrations/supabase/client';

// Create a simple in-memory cache to avoid redundant database queries
const userNameCache = new Map<string, string>();

/**
 * Resolves multiple user IDs to user names using an efficient batch query
 * @param userIds Array of user IDs to resolve to names
 * @returns Map of user ID to display name
 */
export const resolveUserNames = async (userIds: string[]): Promise<Map<string, string>> => {
  const userMap = new Map<string, string>();
  
  try {
    if (!userIds || userIds.length === 0) {
      return userMap;
    }
    
    console.log(`Resolving names for ${userIds.length} users`);
    
    // Filter out any non-string or empty IDs
    const validUserIds = userIds.filter(id => 
      typeof id === 'string' && id.trim() !== ''
    );
    
    if (validUserIds.length === 0) {
      return userMap;
    }

    // Check cache first for each user ID to avoid redundant database queries
    const uncachedUserIds = validUserIds.filter(id => !userNameCache.has(id));
    
    // If we have uncachedUser IDs, fetch them from the database
    if (uncachedUserIds.length > 0) {
      console.log(`Fetching ${uncachedUserIds.length} uncached user names from database`);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', uncachedUserIds);
      
      if (error) {
        console.error('Error fetching user data:', error);
      } else if (userData && userData.length > 0) {
        console.log(`Found ${userData.length} users of ${uncachedUserIds.length} requested`);
        
        // Add fetched users to cache
        userData.forEach(user => {
          // Ensure we have a valid display name - try name first, then email, then fallback
          const displayName = user.name || user.email || 'Unknown User';
          userNameCache.set(user.id, displayName);
        });
      } else {
        console.warn('No user data found for the provided IDs');
      }
    } else {
      console.log('All requested user names were found in cache');
    }
    
    // Populate the return map from cache
    validUserIds.forEach(userId => {
      const cachedName = userNameCache.get(userId);
      if (cachedName) {
        userMap.set(userId, cachedName);
      } else {
        // If we couldn't find the user, use a fallback name
        userMap.set(userId, 'Unknown User');
      }
    });
    
  } catch (err) {
    console.error('Error in resolveUserNames:', err);
  }
  
  return userMap;
};

/**
 * Utility function to get a single user's name - useful for components
 * @param userId User ID to resolve
 * @returns Promise resolving to the user's display name
 */
export const resolveUserName = async (userId: string): Promise<string> => {
  if (!userId) return 'Unassigned';
  
  // Convert to string if it's not already
  const userIdString = String(userId).trim();
  if (!userIdString) return 'Unassigned';
  
  // If cached, return immediately
  if (userNameCache.has(userIdString)) {
    return userNameCache.get(userIdString) || 'Unknown User';
  }
  
  // Otherwise fetch from database
  try {
    console.log(`Fetching user info for ID: ${userIdString}`);
    const { data, error } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userIdString)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching user info:', error);
      return 'Unknown User';
    }
    
    if (data) {
      const name = data.name || data.email || 'Unknown User';
      userNameCache.set(userIdString, name);
      console.log(`Resolved user ${userIdString} to name: ${name}`);
      return name;
    } else {
      console.log(`No user found with ID: ${userIdString}`);
    }
  } catch (error) {
    console.error('Exception fetching user name:', error);
  }
  
  return 'Unknown User';
};

// Function to pre-load user names into cache
export const preloadUserNames = async (userIds: string[]): Promise<void> => {
  const uniqueIds = [...new Set(userIds.filter(id => id && typeof id === 'string'))];
  if (uniqueIds.length === 0) return;
  
  console.log(`Preloading ${uniqueIds.length} user names into cache`);
  await resolveUserNames(uniqueIds);
};

// Function to clear the cache if needed
export const clearUserNameCache = (): void => {
  userNameCache.clear();
  console.log('User name cache cleared');
};
