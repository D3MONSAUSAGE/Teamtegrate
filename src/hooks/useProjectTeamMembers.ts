
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { fetchProjectTeamMembers } from '@/contexts/task/operations/projectTeamOperations';

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
        const members = await fetchProjectTeamMembers(projectId);
        console.log('Team members fetched:', members);
        setTeamMembers(members);
      } catch (err) {
        console.error('Error loading team members:', err);
        setError('Failed to load team members');
        setTeamMembers([]);
      } finally {
        setIsLoading(false);
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
        setIsLoading(true);
        fetchProjectTeamMembers(projectId)
          .then(setTeamMembers)
          .catch((err) => {
            console.error('Error refetching team members:', err);
            setError('Failed to refresh team members');
          })
          .finally(() => setIsLoading(false));
      }
    }
  };
};
