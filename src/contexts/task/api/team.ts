
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

