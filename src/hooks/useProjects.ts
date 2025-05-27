
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
      
      console.log('Fetching ALL projects from database for user:', user.id);
      
      // Fetch ALL projects from the database first
      const { data: allProjects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        throw projectsError;
      }
      
      console.log(`Successfully fetched ${allProjects?.length || 0} total projects from database`);
      allProjects?.forEach(project => {
        console.log(`DB Project: ${project.id}, "${project.title}", Manager: ${project.manager_id}, Team: ${JSON.stringify(project.team_members)}`);
      });
      
      // Filter projects where user has access
      const userProjects = allProjects?.filter(project => {
        const isManager = project.manager_id === user.id;
        const isTeamMember = Array.isArray(project.team_members) && 
          project.team_members.includes(user.id);
        
        const hasAccess = isManager || isTeamMember;
        
        if (hasAccess) {
          console.log(`✓ User has access to project "${project.title}" - ${isManager ? 'Manager' : 'Team Member'}`);
        } else {
          console.log(`✗ User does NOT have access to project "${project.title}"`);
        }
        
        return hasAccess;
      }) || [];
      
      console.log(`After filtering, found ${userProjects.length} accessible projects for user ${user.id}`);
      processProjectData(userProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, tasks]);

  // Helper function to process project data
  const processProjectData = (data: any[]) => {
    if (!data || data.length === 0) {
      console.log('No accessible projects found');
      setProjects([]);
      return;
    }
    
    console.log('Processing project data:', data);
    
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
        } else if (status === 'Completed' || isCompleted) {
          // If not all tasks are completed, project cannot be marked as completed
          status = 'In Progress';
          isCompleted = false;
          
          console.log(`Project ${project.id} status corrected: not all tasks complete but was marked as Completed`);
        }
      }
      
      console.log(`✓ Formatted project: ${project.id} - "${project.title}" (${status}, ${progress}% complete)`);
      
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

    console.log(`Final projects being set: ${formattedProjects.length} projects`);
    formattedProjects.forEach(p => console.log(`Final: ${p.id} - "${p.title}"`));
    
    setProjects(formattedProjects);
  };

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
