
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch user information from Supabase
 */
export const fetchUserInfo = async (userId: string): Promise<string | undefined> => {
  if (!userId) return undefined;
  
  const { data: userData } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', userId)
    .single();
    
  if (userData) {
    return userData.name || userData.email;
  }
  
  return undefined;
};
