
import { supabase } from '@/integrations/supabase/client';

export const resolveUserNames = async (userIds: string[]): Promise<Map<string, string>> => {
  const userMap = new Map<string, string>();
  
  if (userIds.length === 0) return userMap;

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', userIds);

  if (userError) {
    console.error('Error fetching user data:', userError);
    return userMap;
  }

  if (userData) {
    userData.forEach(user => {
      userMap.set(user.id, user.name || user.email);
    });
    console.log(`Loaded ${userData.length} user details`);
  }

  return userMap;
};
