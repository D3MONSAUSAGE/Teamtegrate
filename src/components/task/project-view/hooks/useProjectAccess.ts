
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const useProjectAccess = (projectId: string | null, projects: Project[]) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fallbackProject, setFallbackProject] = useState<Project | null>(null);

  // Find the project - first try from context, then fallback
  const project = projects.find(p => p.id === projectId) || fallbackProject;

  // Fetch project directly from database as fallback with access check
  const fetchProjectDirectly = useCallback(async (id: string) => {
    try {
      console.log('🔄 Fetching project directly from database:', id);
      
      const [projectResult, teamMembershipResult] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('project_team_members')
          .select('project_id')
          .eq('project_id', id)
          .eq('user_id', user!.id)
          .maybeSingle()
      ]);

      if (projectResult.error) {
        console.error('❌ Error fetching project directly:', projectResult.error);
        return null;
      }

      if (!projectResult.data) {
        console.log('❌ Project not found in database');
        return null;
      }

      const projectData = projectResult.data;
      console.log('📊 Found project in database:', projectData);

      // Check if user has access using the same logic as useProjects
      const isManager = String(projectData.manager_id) === String(user!.id);
      const isTeamMemberFromArray = Array.isArray(projectData.team_members) && 
        projectData.team_members.some(memberId => String(memberId) === String(user!.id));
      const isTeamMemberFromTable = !!teamMembershipResult.data;

      const hasAccess = isManager || isTeamMemberFromArray || isTeamMemberFromTable;

      console.log('🔍 Direct access check:', {
        isManager,
        isTeamMemberFromArray,
        isTeamMemberFromTable,
        hasAccess
      });

      if (!hasAccess) {
        console.log('❌ User does not have access to project');
        return null;
      }

      // Convert to Project format
      const formattedProject: Project = {
        id: projectData.id,
        title: projectData.title || '',
        description: projectData.description || '',
        startDate: projectData.start_date ? new Date(projectData.start_date) : new Date(),
        endDate: projectData.end_date ? new Date(projectData.end_date) : new Date(),
        managerId: projectData.manager_id || '',
        createdAt: projectData.created_at ? new Date(projectData.created_at) : new Date(),
        updatedAt: projectData.updated_at ? new Date(projectData.updated_at) : new Date(),
        tasks: [], // Tasks will be loaded from TaskContext
        teamMembers: projectData.team_members || [],
        budget: projectData.budget || 0,
        budgetSpent: projectData.budget_spent || 0,
        is_completed: projectData.is_completed || false,
        status: (projectData.status || 'To Do') as Project['status'],
        tasks_count: projectData.tasks_count || 0,
        tags: projectData.tags || []
      };

      return formattedProject;
    } catch (error) {
      console.error('❌ Error in fetchProjectDirectly:', error);
      return null;
    }
  }, [user]);

  // Check if project exists and user has access
  useEffect(() => {
    const checkProjectAccess = async () => {
      console.log('🔍 useProjectAccess effect running', {
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
        console.log('✅ Found project in context:', contextProject.title);
        setIsLoading(false);
        return;
      }

      // If not found in context, try to fetch directly
      console.log('🔄 Project not found in context, fetching directly from database');
      
      const directProject = await fetchProjectDirectly(projectId);
      
      if (directProject) {
        console.log('✅ Successfully fetched project directly, setting as fallback');
        setFallbackProject(directProject);
        setIsLoading(false);
      } else {
        console.log('❌ Failed to fetch project directly or no access');
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
