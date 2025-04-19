
import { supabase } from '@/integrations/supabase/client';

// Helper function to get team member name from their ID
export const fetchTeamMemberName = async (memberId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('name')
      .eq('id', memberId)
      .single();
    
    if (error || !data) {
      return 'Unknown';
    }
    
    return data.name;
  } catch (error) {
    console.error('Error fetching team member name:', error);
    return 'Unknown';
  }
};

// Function to check if an email exists in auth.users
export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.toLowerCase());
    
    if (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
    
    return count !== null && count > 0;
  } catch (error) {
    console.error('Error in checkUserExists:', error);
    return false;
  }
};
