
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

// Fetch Team Members for a Project
export const fetchProjectTeamMembers = async (
  projectId: string
): Promise<User[]> => {
  try {
    console.log('Fetching project team members for project:', projectId);
    
    // Query project_team_members to get user IDs
    const { data: teamMemberData, error: teamMemberError } = await supabase
      .from('project_team_members')
      .select('user_id')
      .eq('project_id', projectId);
      
    if (teamMemberError) {
      console.error('Error fetching project team members:', teamMemberError);
      return [];
    }
    
    console.log('Team member data:', teamMemberData);
    
    if (!teamMemberData || teamMemberData.length === 0) {
      console.log('No team members found for project:', projectId);
      return [];
    }
    
    // Extract user IDs
    const userIds = teamMemberData.map(member => member.user_id);
    console.log('User IDs to fetch:', userIds);
    
    // Fetch user details including organization_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, role, organization_id')
      .in('id', userIds);
      
    if (userError) {
      console.error('Error fetching team member details:', userError);
      return [];
    }
    
    console.log('User data retrieved:', userData);
    
    // Map the database structure to our User type
    return (userData || []).map(user => ({
      id: user.id,
      name: user.name || user.email || 'User',
      email: user.email,
      role: user.role as User['role'],
      organization_id: user.organization_id,
      createdAt: new Date(), // Add a default createdAt value since it's required but not in our query
      avatar_url: user.avatar_url
    }));
  } catch (error) {
    console.error('Error in fetchProjectTeamMembers:', error);
    return [];
  }
};
