
import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const useProjectData = (projectId: string | undefined) => {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId || !user?.organizationId) return;

      try {
        setIsLoadingProject(true);
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('organization_id', user.organizationId)
          .single();

        if (error) throw error;

        const transformedProject: Project = {
          id: data.id,
          title: data.title || 'Untitled Project',
          description: data.description || '',
          startDate: data.start_date || '',
          endDate: data.end_date || '',
          budget: data.budget || 0,
          budgetSpent: data.budget_spent || 0,
          isCompleted: data.is_completed || false,
          teamMemberIds: data.team_members || [],
          tasksCount: data.tasks_count || 0,
          tags: data.tags || [],
          managerId: data.manager_id || '',
          status: (data.status as ProjectStatus) || 'To Do',
          organizationId: data.organization_id,
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString()
        };

        setProject(transformedProject);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Failed to load project');
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchProject();
  }, [projectId, user?.organizationId]);

  const refetchProject = useCallback(async () => {
    if (!projectId || !user?.organizationId) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('organization_id', user.organizationId)
        .single();

      if (error) throw error;
      
      const transformedProject: Project = {
        id: data.id,
        title: data.title || 'Untitled Project',
        description: data.description || '',
        startDate: data.start_date || '',
        endDate: data.end_date || '',
        budget: data.budget || 0,
        budgetSpent: data.budget_spent || 0,
        isCompleted: data.is_completed || false,
        teamMemberIds: data.team_members || [],
        tasksCount: data.tasks_count || 0,
        tags: data.tags || [],
        managerId: data.manager_id || '',
        status: (data.status as ProjectStatus) || 'To Do',
        organizationId: data.organization_id,
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString()
      };

      setProject(transformedProject);
    } catch (error) {
      console.error('Error refetching project:', error);
    }
  }, [projectId, user?.organizationId]);

  return {
    project,
    isLoadingProject,
    refetchProject
  };
};
