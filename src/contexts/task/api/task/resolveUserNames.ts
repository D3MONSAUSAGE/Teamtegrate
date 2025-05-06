
import { supabase } from '@/integrations/supabase/client';

export const resolveUserNames = async (userIds: string[]): Promise<Map<string, string>> => {
  const userMap = new Map<string, string>();
  
  try {
    if (!userIds || userIds.length === 0) {
      return userMap;
    }
    
    console.log(`Resolving names for ${userIds.length} users`);
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds);
    
    if (error) {
      console.error('Error fetching user data:', error);
      return userMap;
    }
    
    if (!userData || userData.length === 0) {
      console.warn('No user data found for the provided IDs');
      return userMap;
    }
    
    console.log(`Found ${userData.length} users of ${userIds.length} requested`);
    
    userData.forEach(user => {
      userMap.set(user.id, user.name || user.email || 'Unknown User');
    });
    
  } catch (err) {
    console.error('Error in resolveUserNames:', err);
  }
  
  return userMap;
};
