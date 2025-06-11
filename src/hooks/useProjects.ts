import { useState, useEffect, useCallback, useMemo } from 'react';
import { Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

export function useProjects() {
  const { user } = useAuth();
  const [fetchedProjects, setFetchedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user?.organizationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error);
        toast.error('Failed to load projects.');
      } else {
        // Convert database format to app format
        const convertedProjects: Project[] = (data || []).map(project => ({
          id: project.id,
          title: project.title,
          description: project.description,
          startDate: new Date(project.startDate),
          endDate: new Date(project.endDate),
          managerId: project.managerId,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
          teamMemberIds: project.teamMemberIds,
          budget: project.budget,
          budgetSpent: project.budgetSpent,
          isCompleted: project.isCompleted,
          status: project.status,
          tasksCount: project.tasksCount,
          tags: project.tags,
          organizationId: project.organizationId
        }));
        setFetchedProjects(convertedProjects);
      }
    } catch (err: any) {
      setError(err);
      toast.error('An unexpected error occurred while loading projects.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.organizationId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const mappedProjects = useMemo(() => {
    return fetchedProjects.map(project => ({
      ...project,
      isCompleted: project.isCompleted || false,
      tasksCount: project.tasksCount || 0
    }));
  }, [fetchedProjects]);

  return {
    projects: mappedProjects,
    isLoading,
    error,
    refetch: fetchProjects
  };
}
