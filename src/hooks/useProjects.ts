
import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Unified project access checker
const checkProjectAccess = (project: any, userId: string, teamMemberships: string[], userOrgId?: string): boolean => {
  console.log(`🔍 Checking access for project: ${project.id} - "${project.title}"`);
  console.log(`👤 User ID: ${userId} (type: ${typeof userId})`);
  console.log(`👔 Manager ID: ${project.manager_id} (type: ${typeof project.manager_id})`);
  console.log(`👥 Team Members Array:`, project.team_members);
  console.log(`🏢 Team Memberships from table:`, teamMemberships);
  console.log(`🏢 User Org ID:`, userOrgId);

  // Check 1: Organization isolation - project must be in same organization
  // RLS policies should handle this, but adding explicit check for clarity
  
  // Check 2: Is user the manager?
  const isManager = String(project.manager_id) === String(userId);
  console.log(`✅ Is Manager: ${isManager}`);
  
  // Check 3: Is user in team_members array?
  let isTeamMemberFromArray = false;
  if (Array.isArray(project.team_members)) {
    isTeamMemberFromArray = project.team_members.some(memberId => 
      String(memberId) === String(userId)
    );
  }
  console.log(`✅ Is Team Member (from array): ${isTeamMemberFromArray}`);
  
  // Check 4: Is user in project_team_members table?
  const isTeamMemberFromTable = teamMemberships.includes(project.id);
  console.log(`✅ Is Team Member (from table): ${isTeamMemberFromTable}`);
  
  const hasAccess = isManager || isTeamMemberFromArray || isTeamMemberFromTable;
  console.log(`🎯 Final Access Decision: ${hasAccess}`);
  
  if (hasAccess) {
    console.log(`✅ GRANTED: User has access to project "${project.title}" - ${isManager ? 'Manager' : 'Team Member'}`);
  } else {
    console.log(`❌ DENIED: User does NOT have access to project "${project.title}"`);
  }
  
  return hasAccess;
};

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user) {
        console.log('❌ No user found, skipping project fetch');
        setProjects([]);
        setIsLoading(false);
        return;
      }
      
      console.log('🚀 Fetching projects for user:', user.id, 'org:', user.organization_id);
      
      // Fetch all projects and team memberships in parallel
      // RLS policies will automatically filter by organization
      const [allProjectsResult, teamMembershipsResult] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('project_team_members')
          .select('project_id')
          .eq('user_id', user.id)
      ]);
      
      if (allProjectsResult.error) {
        console.error('❌ Error fetching projects:', allProjectsResult.error);
        throw allProjectsResult.error;
      }
      
      if (teamMembershipsResult.error) {
        console.warn('⚠️ Error fetching team memberships:', teamMembershipsResult.error);
      }
      
      const allProjects = allProjectsResult.data || [];
      const teamMemberships = teamMembershipsResult.data?.map(tm => tm.project_id) || [];
      
      console.log(`📊 Found ${allProjects.length} total projects in organization`);
      console.log(`🏢 User is team member of: ${teamMemberships.length} projects via table`);
      
      // Filter projects where user has access (with organization check)
      const accessibleProjects = allProjects.filter(project => 
        checkProjectAccess(project, user.id, teamMemberships, user.organization_id)
      );
      
      console.log(`✅ After filtering, found ${accessibleProjects.length} accessible projects for user ${user.id}`);
      
      // Process and format project data with tasks count
      const formattedProjects: Project[] = accessibleProjects.map(project => {
        // Calculate project status based on completion
        let status = project.status || 'To Do';
        let isCompleted = project.is_completed || false;
        
        // Ensure consistency between status and is_completed
        if (status === 'Completed') {
          isCompleted = true;
        } else if (isCompleted) {
          status = 'Completed';
        }
        
        return {
          id: project.id,
          title: project.title || '',
          description: project.description || '',
          startDate: project.start_date ? new Date(project.start_date) : new Date(),
          endDate: project.end_date ? new Date(project.end_date) : new Date(),
          managerId: project.manager_id || '',
          createdAt: project.created_at ? new Date(project.created_at) : new Date(),
          updatedAt: project.updated_at ? new Date(project.updated_at) : new Date(),
          tasks: [], // Tasks will be loaded separately in TaskContext
          teamMembers: project.team_members || [],
          budget: project.budget || 0,
          budgetSpent: project.budget_spent || 0,
          is_completed: isCompleted,
          status: status as Project['status'],
          tasks_count: project.tasks_count || 0,
          tags: project.tags || [],
          organizationId: user.organization_id
        };
      });
      
      console.log('🎯 Final projects being set:', formattedProjects.map(p => `${p.id} - "${p.title}"`));
      setProjects(formattedProjects);
      
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
      setProjects([]);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    isLoading,
    refreshProjects: fetchProjects,
    error
  };
};
