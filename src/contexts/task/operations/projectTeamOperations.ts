
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { mapDbUserToApp } from '@/utils/typeCompatibility';

export const fetchProjectTeamMembers = async (
  projectId: string,
  organizationId: string,
  setUsers: React.Dispatch<React.SetStateAction<User[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
): Promise<void> => {
  try {
    setIsLoading(true);

    // Get team member IDs for the project
    const { data: teamMembersData, error: teamError } = await supabase
      .from('project_team_members')
      .select('user_id')
      .eq('project_id', projectId);

    if (teamError) {
      toast.error('Failed to load team members');
      return;
    }

    if (!teamMembersData || teamMembersData.length === 0) {
      setUsers([]);
      return;
    }

    // Get user details for team members
    const userIds = teamMembersData.map(tm => tm.user_id);
    
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds)
      .eq('organization_id', organizationId);

    if (usersError) {
      toast.error('Failed to load user details');
      return;
    }

    // Transform database users to app format
    const transformedUsers = (usersData || []).map(dbUser => mapDbUserToApp(dbUser));

    setUsers(transformedUsers);
  } catch (error) {
    toast.error('Failed to load team members');
  } finally {
    setIsLoading(false);
  }
};
