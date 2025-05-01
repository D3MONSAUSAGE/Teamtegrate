
import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectStatus, Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';

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
      
      // Fetch all projects
      const { data, error } = await supabase
        .from('projects')
        .select('*');

      if (error) {
        console.error('Error fetching projects:', error);
        setError(new Error(error.message));
        setProjects([]);
        return;
      }

      console.log('Projects fetched:', data);

      const formattedProjects: Project[] = data.map(project => {
        // Get project tasks to calculate accurate status
        const projectTasks = tasks.filter(task => task.projectId === project.id);
        const totalTasks = project.tasks_count || 0;
        const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
        
        // Determine status based on task completion
        let status = project.status || 'To Do';
        let isCompleted = project.is_completed || false;
        
        // Auto-mark project as completed if all tasks are done (and there are tasks)
        if (totalTasks > 0 && completedTasks === totalTasks) {
          status = 'Completed';
          isCompleted = true;
        } else if (status === 'Completed') {
          // Ensure consistency
          isCompleted = true;
        } else if (isCompleted) {
          status = 'Completed';
        }
        
        console.log(`Project ${project.id}: status=${status}, is_completed=${isCompleted}, tasks=${totalTasks}, completed=${completedTasks}`);
        
        return {
          id: project.id,
          title: project.title || '',
          description: project.description || '',
          startDate: project.start_date ? new Date(project.start_date) : new Date(),
          endDate: project.end_date ? new Date(project.end_date) : new Date(),
          managerId: project.manager_id || '',
          createdAt: project.created_at ? new Date(project.created_at) : new Date(),
          updatedAt: project.updated_at ? new Date(project.updated_at) : new Date(),
          tasks: projectTasks,
          teamMembers: project.team_members || [],
          budget: project.budget || 0,
          budgetSpent: project.budget_spent || 0,
          is_completed: isCompleted,
          status: status as ProjectStatus,
          tasks_count: totalTasks,
          tags: project.tags || []
        };
      });

      console.log('Formatted projects with task data:', formattedProjects);
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
