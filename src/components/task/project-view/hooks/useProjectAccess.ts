
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Project, ProjectStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const useProjectAccess = (projectId: string | null, projects: Project[], tasks: any[]) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fallbackProject, setFallbackProject] = useState<Project | null>(null);

  // Find the project - first try from context, then fallback
  const project = projects.find(p => p.id === projectId) || fallbackProject;

  // Fetch project directly from database as fallback
  const fetchProjectDirectly = useCallback(async (id: string) => {
    try {
      console.log('Fetching project directly from database:', id);
      
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching project directly:', error);
        return null;
      }

      if (!projectData) {
        console.log('Project not found in database');
        return null;
      }

      console.log('Found project in database:', projectData);

      // Check if user has access - they could be manager or team member
      const isManager = projectData.manager_id === user?.id;
      
      // Check team membership from project_team_members table
      const { data: teamMemberData } = await supabase
        .from('project_team_members')
        .select('*')
        .eq('project_id', id)
        .eq('user_id', user?.id || '')
        .single();
      
      const isTeamMemberFromTable = !!teamMemberData;
      
      // Check team membership from team_members array  
      const isTeamMemberFromArray = Array.isArray(projectData.team_members) && 
        projectData.team_members.some(memberId => String(memberId) === String(user?.id));

      const hasAccess = isManager || isTeamMemberFromTable || isTeamMemberFromArray;
      
      console.log('Direct access check results:', {
        projectTitle: projectData.title,
        userId: user?.id,
        isManager,
        isTeamMemberFromTable,
        isTeamMemberFromArray,
        hasAccess
      });

      if (!hasAccess) {
        console.log('User does not have access to project');
        return null;
      }

      // Get project tasks for this specific project
      const projectTasks = tasks.filter(task => task.projectId === projectId);

      // Convert to Project format with proper type casting
      const formattedProject: Project = {
        id: projectData.id,
        title: projectData.title || '',
        description: projectData.description || '',
        startDate: projectData.start_date ? new Date(projectData.start_date) : new Date(),
        endDate: projectData.end_date ? new Date(projectData.end_date) : new Date(),
        managerId: projectData.manager_id || '',
        createdAt: projectData.created_at ? new Date(projectData.created_at) : new Date(),
        updatedAt: projectData.updated_at ? new Date(projectData.updated_at) : new Date(),
        tasks: projectTasks,
        teamMembers: projectData.team_members || [],
        budget: projectData.budget || 0,
        budgetSpent: projectData.budget_spent || 0,
        is_completed: projectData.is_completed || false,
        status: (projectData.status || 'To Do') as ProjectStatus,
        tasks_count: projectTasks.length,
        tags: projectData.tags || []
      };

      return formattedProject;
    } catch (error) {
      console.error('Error in fetchProjectDirectly:', error);
      return null;
    }
  }, [user?.id, tasks, projectId]);

  // Check if project exists and user has access
  useEffect(() => {
    const checkProjectAccess = async () => {
      console.log('useProjectAccess effect running', {
        projectId,
        user: !!user,
        projectsLength: projects.length,
        foundProject: !!project
      });

      if (!projectId) {
        setLoadError("No project ID provided");
        setIsLoading(false);
        return;
      }

      if (!user) {
        setLoadError("User not authenticated");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      setFallbackProject(null);

      // First, try to find project in context
      const contextProject = projects.find(p => p.id === projectId);
      
      if (contextProject) {
        console.log('Found project in context:', contextProject.title);
        
        // Check access for context project
        const isManager = contextProject.managerId === user.id;
        const isTeamMemberFromArray = contextProject.teamMembers?.some(memberId => 
          String(memberId) === String(user.id)
        );
        
        // Also check team membership from database table
        const { data: teamMemberData } = await supabase
          .from('project_team_members')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .single();
        
        const isTeamMemberFromTable = !!teamMemberData;
        
        if (isManager || isTeamMemberFromArray || isTeamMemberFromTable) {
          console.log('User has access to context project');
          setIsLoading(false);
          return;
        } else {
          console.log('User does not have access to context project');
          setLoadError("You don't have access to this project");
          setIsLoading(false);
          return;
        }
      }

      // If not found in context, try to fetch directly
      console.log('Project not found in context, fetching directly from database');
      
      const directProject = await fetchProjectDirectly(projectId);
      
      if (directProject) {
        console.log('Successfully fetched project directly, setting as fallback');
        setFallbackProject(directProject);
        setIsLoading(false);
      } else {
        console.log('Failed to fetch project directly or no access');
        setLoadError("Project not found or you don't have access to it");
        setIsLoading(false);
      }
    };

    checkProjectAccess();
  }, [projectId, user, projects, fetchProjectDirectly]);

  return {
    project,
    isLoading,
    loadError
  };
};
