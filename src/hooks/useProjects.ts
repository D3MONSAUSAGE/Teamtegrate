
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, ProjectStatus } from '@/types';
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
          startDate: new Date(project.start_date),
          endDate: new Date(project.end_date),
          managerId: project.manager_id,
          createdAt: new Date(project.created_at),
          updatedAt: new Date(project.updated_at),
          teamMemberIds: project.team_members || [],
          budget: project.budget,
          budgetSpent: project.budget_spent || 0,
          isCompleted: project.is_completed || false,
          status: (project.status as ProjectStatus) || 'To Do',
          tasksCount: project.tasks_count || 0,
          tags: project.tags || [],
          organizationId: project.organization_id
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
