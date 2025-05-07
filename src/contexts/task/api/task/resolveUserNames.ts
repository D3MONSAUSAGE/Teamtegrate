import { supabase } from '@/integrations/supabase/client';

// Create a simple in-memory cache to avoid redundant database queries
const userNameCache = new Map<string, string>();

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
    
    // If we have uncached user IDs, fetch them from the database
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
        userMap.set(userId, 'User');
      }
    });
    
  } catch (err) {
    console.error('Error in resolveUserNames:', err);
  }
  
  return userMap;
};

// Utility function to get a single user's name - useful for components
export const resolveUserName = async (userId: string): Promise<string> => {
  if (!userId) return 'Unassigned';
  
  // If cached, return immediately
  if (userNameCache.has(userId)) {
    return userNameCache.get(userId) || 'Unknown User';
  }
  
  // Otherwise fetch from database
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching user info:', error);
      return 'Unknown User';
    }
    
    if (data) {
      const name = data.name || data.email || 'Unknown User';
      userNameCache.set(userId, name);
      return name;
    }
  } catch (error) {
    console.error('Exception fetching user name:', error);
  }
  
  return 'Unknown User';
};
