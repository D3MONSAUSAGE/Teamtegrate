
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { mapDbUserToApp } from '@/utils/typeCompatibility';

const fetchProjectTeamMembers = async (
  projectId: string,
  organizationId: string = '',
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
      console.error('Error fetching team members:', teamError);
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
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      toast.error('Failed to load user details');
      return;
    }

    // Transform database users to app format
    const transformedUsers = (usersData || []).map(dbUser => mapDbUserToApp(dbUser));

    setUsers(transformedUsers);
  } catch (error) {
    console.error('Error in fetchProjectTeamMembers:', error);
    toast.error('Failed to load team members');
  } finally {
    setIsLoading(false);
  }
};

export const useProjectTeamMembers = (projectId: string | null) => {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setTeamMembers([]);
      return;
    }

    const loadTeamMembers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching team members for project:', projectId);
        await fetchProjectTeamMembers(projectId, '', setTeamMembers, setIsLoading);
        console.log('Team members fetched successfully');
      } catch (err) {
        console.error('Error loading team members:', err);
        setError('Failed to load team members');
        setTeamMembers([]);
      }
    };

    loadTeamMembers();
  }, [projectId]);

  return {
    teamMembers,
    isLoading,
    error,
    refetch: () => {
      if (projectId) {
        fetchProjectTeamMembers(projectId, '', setTeamMembers, setIsLoading);
      }
    }
  };
};
