
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
    if (!user?.organizationId) {
      console.log('useProjects: No user or organizationId, skipping fetch');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('useProjects: Fetching projects for organization:', user.organizationId);
      console.log('useProjects: Current user:', user);
      
      // Enhanced query with explicit organization filtering as safety net
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', user.organizationId) // Explicit organization filter
        .order('created_at', { ascending: false });

      if (error) {
        console.error('useProjects: Error fetching projects:', error);
        console.error('useProjects: Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        setError(error);
        toast.error(`Failed to load projects: ${error.message}`);
      } else {
        console.log(`useProjects: Successfully fetched ${data?.length || 0} projects from database`);
        console.log('useProjects: Raw projects data:', data);
        
        if (!data || data.length === 0) {
          console.log('useProjects: No projects found for organization:', user.organizationId);
          setFetchedProjects([]);
          return;
        }
        
        // Convert database format to app format with enhanced error handling
        const convertedProjects: Project[] = data.map(project => {
          try {
            return {
              id: project.id,
              title: project.title || 'Untitled Project',
              description: project.description || '',
              startDate: project.start_date ? new Date(project.start_date) : new Date(),
              endDate: project.end_date ? new Date(project.end_date) : new Date(),
              managerId: project.manager_id || '',
              createdAt: project.created_at ? new Date(project.created_at) : new Date(),
              updatedAt: project.updated_at ? new Date(project.updated_at) : new Date(),
              teamMemberIds: project.team_members || [],
              budget: project.budget || 0,
              budgetSpent: project.budget_spent || 0,
              isCompleted: project.is_completed || false,
              status: (project.status as ProjectStatus) || 'To Do',
              tasksCount: project.tasks_count || 0,
              tags: project.tags || [],
              organizationId: project.organization_id
            };
          } catch (conversionError) {
            console.error('useProjects: Error converting project:', project.id, conversionError);
            // Return a basic project structure to avoid breaking the entire list
            return {
              id: project.id || 'unknown',
              title: project.title || 'Untitled Project',
              description: project.description || '',
              startDate: new Date(),
              endDate: new Date(),
              managerId: project.manager_id || '',
              createdAt: new Date(),
              updatedAt: new Date(),
              teamMemberIds: [],
              budget: 0,
              budgetSpent: 0,
              isCompleted: false,
              status: 'To Do' as ProjectStatus,
              tasksCount: 0,
              tags: [],
              organizationId: project.organization_id || ''
            };
          }
        });
        
        console.log('useProjects: Successfully converted projects:', convertedProjects);
        setFetchedProjects(convertedProjects);
      }
    } catch (err: any) {
      console.error('useProjects: Unexpected error:', err);
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

  const setProjects = useCallback((updater: React.SetStateAction<Project[]>) => {
    if (typeof updater === 'function') {
      setFetchedProjects(prevProjects => updater(prevProjects));
    } else {
      setFetchedProjects(updater);
    }
  }, []);

  return {
    projects: mappedProjects,
    setProjects,
    isLoading,
    error,
    refetch: fetchProjects,
    refreshProjects: fetchProjects // Add alias for compatibility
  };
}
