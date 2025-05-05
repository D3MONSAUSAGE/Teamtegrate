
import { supabase } from '@/integrations/supabase/client';

export const resolveUserNames = async (userIds: string[]): Promise<Map<string, string>> => {
  const userMap = new Map<string, string>();
  
  try {
    if (!userIds || userIds.length === 0) {
      return userMap;
    }
    
    // Filter out invalid UUIDs to prevent database errors
    const validUserIds = userIds.filter(id => {
      // Simple UUID validation pattern
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidPattern.test(id);
    });
    
    if (validUserIds.length === 0) {
      console.log('No valid UUIDs found in user IDs list');
      return userMap;
    }
    
    console.log(`Resolving names for ${validUserIds.length} valid users`);
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', validUserIds);
    
    if (error) {
      console.error('Error fetching user data:', error);
      return userMap;
    }
    
    if (!userData || userData.length === 0) {
      console.warn('No user data found for the provided IDs');
      return userMap;
    }
    
    console.log(`Found ${userData.length} users of ${validUserIds.length} requested`);
    
    userData.forEach(user => {
      userMap.set(user.id, user.name || user.email || 'Unknown User');
    });
    
  } catch (err) {
    console.error('Error in resolveUserNames:', err);
  }
  
  return userMap;
};
