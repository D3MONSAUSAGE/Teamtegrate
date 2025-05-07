
import { supabase } from '@/integrations/supabase/client';

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
      const displayName = user.name || user.email || 'Unknown User';
      userMap.set(user.id, displayName);
      console.log(`Mapped user ${user.id} to name: ${displayName}`);
    });
    
  } catch (err) {
    console.error('Error in resolveUserNames:', err);
  }
  
  return userMap;
};
