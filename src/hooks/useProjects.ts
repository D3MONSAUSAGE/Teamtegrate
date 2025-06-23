import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Project } from '@/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { requestManager } from '@/utils/requestManager';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProjects = async () => {
    if (!user) {
      console.log('useProjects: No user, skipping fetch');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const cacheKey = `projects-${user.organizationId}-${user.id}`;
      
      console.log('useProjects: Fetching projects for user:', {
        userId: user.id,
        userRole: user.role,
        organizationId: user.organizationId
      });
      
      const data = await requestManager.dedupe(cacheKey, async () => {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
        );

        let projectPromise;

        // Role-based access logic
        if (user.role === 'superadmin' || user.role === 'admin') {
          // Superadmins and admins can see ALL projects in their organization
          console.log('useProjects: Fetching ALL projects for superadmin/admin');
          projectPromise = supabase
            .from('projects')
            .select('*')
            .eq('organization_id', user.organizationId)
            .order('updated_at', { ascending: false });
        } else {
          // Regular users and managers see only projects they manage or are team members of
          console.log('useProjects: Fetching user-specific projects for regular user/manager');
          projectPromise = supabase
            .from('projects')
            .select('*')
            .eq('organization_id', user.organizationId)
            .or(`manager_id.eq.${user.id},team_members.cs.{${user.id}}`)
            .order('updated_at', { ascending: false });
        }

        const { data, error } = await Promise.race([
          projectPromise,
          timeoutPromise
        ]) as any;

        if (error) {
          console.error('useProjects: Error fetching projects:', error);
          
          // Enhanced error handling with specific error types
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('Network Error') ||
              error.message?.includes('timeout')) {
            throw new Error('Network connection issue. Please check your connection and try again.');
          }
          
          if (error.message?.includes('permission') || 
              error.message?.includes('unauthorized')) {
            throw new Error('You do not have permission to access these projects.');
          }
          
          throw error;
        }

        console.log('useProjects: Retrieved projects from database:', {
          userId: user.id,
          userRole: user.role,
          projectCount: data?.length || 0,
          projects: data?.map(p => ({ id: p.id, title: p.title, manager_id: p.manager_id, team_members: p.team_members })),
          timestamp: new Date().toISOString()
        });

        return data;
      });

      // Validate projects belong to user's organization
      const validatedProjects = data?.filter(dbProject => {
        if (dbProject.organization_id !== user.organizationId) {
          console.error('useProjects: SECURITY VIOLATION - Project from different organization:', {
            projectId: dbProject.id,
            projectOrg: dbProject.organization_id,
            userOrg: user.organizationId
          });
          return false;
        }
        return true;
      }) || [];

      // Transform database projects to match Project type
      const transformedProjects: Project[] = validatedProjects.map(dbProject => {
        return {
          id: dbProject.id,
          title: dbProject.title || '',
          description: dbProject.description || '',
          startDate: dbProject.start_date || dbProject.created_at,
          endDate: dbProject.end_date || dbProject.updated_at,
          managerId: dbProject.manager_id || '',
          createdAt: dbProject.created_at,
          updatedAt: dbProject.updated_at,
          teamMemberIds: dbProject.team_members || [],
          budget: dbProject.budget || 0,
          budgetSpent: dbProject.budget_spent || 0,
          isCompleted: dbProject.is_completed || false,
          status: dbProject.status as Project['status'] || 'To Do',
          tasksCount: dbProject.tasks_count || 0,
          tags: dbProject.tags || [],
          organizationId: dbProject.organization_id
        };
      });

      setProjects(transformedProjects);
      setError(null);
      
      console.log('useProjects: Successfully processed projects:', {
        originalCount: data?.length || 0,
        validatedCount: validatedProjects.length,
        transformedCount: transformedProjects.length,
        userId: user.id,
        role: user.role,
        userCanSeeAll: user.role === 'superadmin' || user.role === 'admin'
      });
      
    } catch (err: any) {
      console.error('useProjects: Fetch error:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      
      setError(errorMessage);
      
      // Only show toast for unexpected errors, not network issues (resilient hook will handle those)
      if (!errorMessage.includes('Network connection issue') && !errorMessage.includes('timeout')) {
        console.error('Unexpected error loading projects:', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (
    title: string, 
    description?: string, 
    startDate?: string, 
    endDate?: string, 
    budget?: number
  ) => {
    if (!user?.id || !user?.organizationId) {
      console.error('useProjects: Missing user or organization info:', { 
        userId: user?.id, 
        orgId: user?.organizationId 
      });
      toast.error('Unable to create project: User not properly authenticated');
      return;
    }

    try {
      console.log('useProjects: Creating project:', { 
        title, 
        description, 
        userId: user.id, 
        orgId: user.organizationId 
      });
      
      const supabaseProject = {
        id: uuidv4(),
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        budget,
        manager_id: user.id,
        organization_id: user.organizationId,
        team_members: [user.id]
      };
      
      const { data, error } = await supabase
        .from('projects')
        .insert([supabaseProject])
        .select()
        .single();

      if (error) {
        console.error('useProjects: Error creating project:', error);
        throw error;
      }
      
      console.log('useProjects: Successfully created project:', data);
      
      const transformedProject: Project = {
        id: data.id,
        title: data.title || '',
        description: data.description || '',
        startDate: data.start_date || data.created_at,
        endDate: data.end_date || data.updated_at,
        managerId: data.manager_id || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        teamMemberIds: data.team_members || [],
        budget: data.budget || 0,
        budgetSpent: data.budget_spent || 0,
        isCompleted: data.is_completed || false,
        status: data.status as Project['status'] || 'To Do',
        tasksCount: data.tasks_count || 0,
        tags: data.tags || [],
        organizationId: data.organization_id
      };
      
      setProjects(prev => [transformedProject, ...prev]);
      toast.success('Project created successfully');
      return transformedProject;
    } catch (err: any) {
      console.error('useProjects: Create project error:', err);
      toast.error(`Failed to create project: ${err.message}`);
      throw err;
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      console.log('useProjects: Deleting project:', projectId);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('useProjects: Error deleting project:', error);
        throw error;
      }
      
      setProjects(prev => prev.filter(project => project.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (err: any) {
      console.error('useProjects: Delete project error:', err);
      toast.error(`Failed to delete project: ${err.message}`);
      throw err;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  // Subscribe to real-time updates with proper filtering
  useEffect(() => {
    if (!user) return;

    console.log('useProjects: Setting up real-time subscription for projects');
    const channel = supabase
      .channel('projects_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          console.log('useProjects: Real-time project update received:', payload);
          fetchProjects(); // Refetch to ensure proper filtering and authorization
        }
      )
      .subscribe();

    return () => {
      console.log('useProjects: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    projects,
    loading,
    isLoading: loading,
    error,
    fetchProjects,
    refetch: fetchProjects,
    refreshProjects: fetchProjects,
    createProject,
    deleteProject,
    setProjects
  };
}
