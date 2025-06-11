
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

  // Check if user has access to a project
  const checkUserAccess = useCallback(async (projectData: any): Promise<boolean> => {
    if (!user?.id) return false;

    console.log('Checking access for project:', projectData.title || projectData.id);
    console.log('User ID:', user.id);
    console.log('Manager ID:', projectData.manager_id);
    console.log('Team Members Array:', projectData.team_members);

    // Check 1: Is user the manager?
    const isManager = String(projectData.manager_id) === String(user.id);
    console.log('Is Manager:', isManager);

    // Check 2: Is user in team_members array?
    let isTeamMemberFromArray = false;
    if (Array.isArray(projectData.team_members)) {
      isTeamMemberFromArray = projectData.team_members.some(memberId => 
        String(memberId) === String(user.id)
      );
    }
    console.log('Is Team Member (from array):', isTeamMemberFromArray);

    // Check 3: Is user in project_team_members table?
    const { data: teamMemberData, error: teamError } = await supabase
      .from('project_team_members')
      .select('*')
      .eq('project_id', projectData.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (teamError) {
      console.error('Error checking team membership:', teamError);
    }

    const isTeamMemberFromTable = !!teamMemberData;
    console.log('Is Team Member (from table):', isTeamMemberFromTable);

    const hasAccess = isManager || isTeamMemberFromArray || isTeamMemberFromTable;
    console.log('Final Access Decision:', hasAccess);

    return hasAccess;
  }, [user?.id]);

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

      // Check if user has access
      const hasAccess = await checkUserAccess(projectData);

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
  }, [user?.id, tasks, projectId, checkUserAccess]);

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
        
        // Check access for context project using same logic
        const contextProjectData = {
          id: contextProject.id,
          title: contextProject.title,
          manager_id: contextProject.managerId,
          team_members: contextProject.teamMembers
        };

        const hasAccess = await checkUserAccess(contextProjectData);
        
        if (hasAccess) {
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
  }, [projectId, user, projects, fetchProjectDirectly, checkUserAccess]);

  return {
    project,
    isLoading,
    loadError
  };
};
