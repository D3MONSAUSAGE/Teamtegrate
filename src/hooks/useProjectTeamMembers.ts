
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { mapDbUserToApp } from '@/utils/typeCompatibility';

const fetchProjectTeamMembers = async (
  projectId: string,
  organizationId: string = '',
  setUsers: React.Dispatch<React.SetStateAction<User[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): Promise<void> => {
  try {
    setIsLoading(true);
    setError(null);

    console.log('fetchProjectTeamMembers: Starting fetch for project:', projectId);

    // Create timeout promise for better error handling
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
    );

    // First try to get team member IDs from the project_team_members table
    const teamMembersPromise = supabase
      .from('project_team_members')
      .select('user_id')
      .eq('project_id', projectId);

    const { data: teamMembersData, error: teamError } = await Promise.race([
      teamMembersPromise,
      timeoutPromise
    ]) as any;

    if (teamError) {
      console.error('Error fetching team members from project_team_members:', teamError);
      const errorMessage = teamError.message?.includes('Failed to fetch') 
        ? 'Network connection issue - unable to load team members'
        : `Failed to load team members: ${teamError.message}`;
      setError(errorMessage);
      return;
    }

    let userIds: string[] = [];

    if (teamMembersData && teamMembersData.length > 0) {
      // Got team members from the project_team_members table
      userIds = teamMembersData.map((tm: any) => tm.user_id);
      console.log('fetchProjectTeamMembers: Found team members in project_team_members table:', userIds);
    } else {
      // Fallback: Try to get team members from the projects.team_members array
      console.log('fetchProjectTeamMembers: No team members in project_team_members table, checking projects.team_members array');
      
      const projectPromise = supabase
        .from('projects')
        .select('team_members')
        .eq('id', projectId)
        .single();

      const { data: projectData, error: projectError } = await Promise.race([
        projectPromise,
        timeoutPromise
      ]) as any;

      if (projectError) {
        console.error('Error fetching project team_members array:', projectError);
        const errorMessage = projectError.message?.includes('Failed to fetch')
          ? 'Network connection issue - unable to load project data'
          : `Failed to load project data: ${projectError.message}`;
        setError(errorMessage);
        return;
      }

      if (projectData?.team_members && Array.isArray(projectData.team_members)) {
        userIds = projectData.team_members.map((id: any) => id.toString());
        console.log('fetchProjectTeamMembers: Found team members in projects.team_members array:', userIds);
        
        // Data consistency warning
        if (userIds.length > 0) {
          console.warn('fetchProjectTeamMembers: Data inconsistency detected - team members exist in projects.team_members but not in project_team_members table');
        }
      }
    }

    if (userIds.length === 0) {
      console.log('fetchProjectTeamMembers: No team members found for project');
      setUsers([]);
      return;
    }

    // Get user details for team members
    console.log('fetchProjectTeamMembers: Fetching user details for IDs:', userIds);
    
    const usersPromise = supabase
      .from('users')
      .select('*')
      .in('id', userIds);

    const { data: usersData, error: usersError } = await Promise.race([
      usersPromise,
      timeoutPromise
    ]) as any;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      const errorMessage = usersError.message?.includes('Failed to fetch')
        ? 'Network connection issue - unable to load user details'
        : `Failed to load user details: ${usersError.message}`;
      setError(errorMessage);
      return;
    }

    // Transform database users to app format
    const transformedUsers = (usersData || []).map((dbUser: any) => mapDbUserToApp(dbUser));

    console.log('fetchProjectTeamMembers: Successfully loaded team members:', transformedUsers.length);
    setUsers(transformedUsers);
  } catch (error: any) {
    console.error('Error in fetchProjectTeamMembers:', error);
    const errorMessage = error.message?.includes('timeout')
      ? 'Request timed out - please check your connection'
      : 'Failed to load team members';
    setError(errorMessage);
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
      setError(null);
      return;
    }

    const loadTeamMembers = async () => {
      console.log('useProjectTeamMembers: Loading team members for project:', projectId);
      await fetchProjectTeamMembers(projectId, '', setTeamMembers, setIsLoading, setError);
    };

    loadTeamMembers();
  }, [projectId]);

  const refetch = async () => {
    if (projectId) {
      console.log('useProjectTeamMembers: Manual refetch triggered');
      await fetchProjectTeamMembers(projectId, '', setTeamMembers, setIsLoading, setError);
    }
  };

  return {
    teamMembers,
    isLoading,
    error,
    refetch
  };
};
