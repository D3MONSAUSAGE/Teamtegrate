
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

// Fetch Team Members for a Project
export const fetchProjectTeamMembers = async (
  projectId: string
): Promise<User[]> => {
  try {
    // Query project_team_members to get user IDs
    const { data: teamMemberData, error: teamMemberError } = await supabase
      .from('project_team_members')
      .select('user_id')
      .eq('project_id', projectId);
      
    if (teamMemberError) {
      console.error('Error fetching project team members:', teamMemberError);
      return [];
    }
    
    if (!teamMemberData || teamMemberData.length === 0) {
      return [];
    }
    
    // Extract user IDs
    const userIds = teamMemberData.map(member => member.user_id);
    
    // Fetch user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, role')
      .in('id', userIds);
      
    if (userError) {
      console.error('Error fetching team member details:', userError);
      return [];
    }
    
    return userData || [];
  } catch (error) {
    console.error('Error in fetchProjectTeamMembers:', error);
    return [];
  }
};

// Update the export from operations/index.ts to include the new file
