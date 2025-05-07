
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
      
      // Use the filter to only get projects where the user is a team member or manager
      const { data, error } = await supabase
        .from('projects')
        .select('*, project_team_members!inner(user_id)')
        .or(`manager_id.eq.${user.id}, project_team_members.user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

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
        const totalTasks = projectTasks.length;
        const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
        
        // Calculate progress based on completed tasks
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Determine status based on task completion
        let status = project.status || 'To Do';
        let isCompleted = project.is_completed || false;
        
        // Fix any status inconsistencies
        if (totalTasks > 0) {
          const allTasksCompleted = completedTasks === totalTasks;
          
          if (allTasksCompleted) {
            status = 'Completed';
            isCompleted = true;
          } else {
            // If not all tasks are completed, project cannot be marked as completed
            if (status === 'Completed' || isCompleted) {
              status = 'In Progress';
              isCompleted = false;
              
              // Log the status correction
              console.log(`Project ${project.id} status corrected: not all tasks complete but was marked as Completed`);
            }
          }
        }
        
        console.log(`Project ${project.id}: status=${status}, is_completed=${isCompleted}, tasks=${totalTasks}, completed=${completedTasks}, progress=${progress}%`);
        
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
      
      // Check for any projects with status inconsistencies that need to be fixed in database
      for (const project of formattedProjects) {
        const dbProject = data.find(p => p.id === project.id);
        
        if (dbProject && (dbProject.status !== project.status || dbProject.is_completed !== project.is_completed)) {
          console.log(`Fixing project ${project.id} status in database: ${dbProject.status}→${project.status}, ${dbProject.is_completed}→${project.is_completed}`);
          
          await supabase
            .from('projects')
            .update({
              status: project.status,
              is_completed: project.is_completed
            })
            .eq('id', project.id);
        }
      }
      
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
