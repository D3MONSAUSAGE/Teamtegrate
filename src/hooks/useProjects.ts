
import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import { fetchAllProjects, fetchTeamMemberships } from './projects/projectFetcher';
import { filterUserProjects } from './projects/projectAccessFilter';
import { processProjectData } from './projects/projectDataProcessor';

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { tasks } = useTask();

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user) {
        console.log('No user found, skipping project fetch');
        setProjects([]);
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching projects for user:', user.id);
      
      // Fetch all projects and team memberships
      const [allProjects, projectsUserIsTeamMemberOf] = await Promise.all([
        fetchAllProjects(),
        fetchTeamMemberships(user.id)
      ]);
      
      console.log(`Found ${allProjects.length} total projects in database`);
      console.log(`User is team member of: ${projectsUserIsTeamMemberOf}`);
      
      // Filter projects where user has access (now async)
      const userProjects = await filterUserProjects(allProjects, user.id, projectsUserIsTeamMemberOf);
      
      console.log(`After filtering, found ${userProjects.length} accessible projects for user ${user.id}`);
      
      // Process and format project data
      const formattedProjects = processProjectData(userProjects, tasks);
      setProjects(formattedProjects);
      
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, tasks]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setIsLoading(false);
    }
  }, [user, fetchProjects]);

  return {
    projects,
    isLoading,
    refreshProjects: fetchProjects,
    error
  };
};
