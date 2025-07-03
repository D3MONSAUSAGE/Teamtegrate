
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Project } from '@/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { requestManager } from '@/utils/requestManager';
import { validateUUID, sanitizeProjectData } from '@/utils/uuidValidation';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProjects = async () => {
    if (!user?.organizationId) {
      console.log('useProjects: No user or organization ID, skipping fetch');
      setLoading(false);
      setProjects([]);
      return;
    }
    
    // Validate organization ID before making request
    const validOrgId = validateUUID(user.organizationId);
    if (!validOrgId) {
      console.error('useProjects: Invalid organization ID:', user.organizationId);
      setError('Invalid organization configuration');
      setLoading(false);
      setProjects([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const cacheKey = `projects-${validOrgId}-${user.id}`;
      
      console.log('useProjects: Fetching projects for user:', {
        userId: user.id,
        userRole: user.role,
        organizationId: validOrgId
      });
      
      const data = await requestManager.dedupe(cacheKey, async () => {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
        );

        let projectPromise;

        // Role-based access logic with UUID validation
        if (user.role === 'superadmin' || user.role === 'admin') {
          console.log('useProjects: Fetching ALL projects for superadmin/admin');
          projectPromise = supabase
            .from('projects')
            .select('*')
            .eq('organization_id', validOrgId)
            .order('updated_at', { ascending: false });
        } else {
          const validUserId = validateUUID(user.id);
          if (!validUserId) {
            throw new Error('Invalid user ID format');
          }
          
          console.log('useProjects: Fetching user-specific projects for regular user/manager');
          projectPromise = supabase
            .from('projects')
            .select('*')
            .eq('organization_id', validOrgId)
            .or(`manager_id.eq.${validUserId},team_members.cs.{${validUserId}}`)
            .order('updated_at', { ascending: false });
        }

        const { data, error } = await Promise.race([
          projectPromise,
          timeoutPromise
        ]) as any;

        if (error) {
          console.error('useProjects: Error fetching projects:', error);
          
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
          timestamp: new Date().toISOString()
        });

        return data || [];
      });

      // Validate and sanitize all project data
      const validatedProjects = data
        .filter(dbProject => {
          const validOrgId = validateUUID(dbProject.organization_id);
          if (!validOrgId || validOrgId !== user.organizationId) {
            console.error('useProjects: SECURITY VIOLATION - Project from different organization:', {
              projectId: dbProject.id,
              projectOrg: dbProject.organization_id,
              userOrg: user.organizationId
            });
            return false;
          }
          return true;
        })
        .map(sanitizeProjectData);

      // Transform database projects to match Project type
      const transformedProjects: Project[] = await Promise.all(
        validatedProjects.map(async (dbProject) => {
          try {
            // Fetch comments for this project
            const { fetchProjectComments } = await import('@/contexts/task/api/comments');
            const comments = await fetchProjectComments(dbProject.id);

            return {
              id: dbProject.id || '',
              title: dbProject.title || '',
              description: dbProject.description || '',
              startDate: dbProject.start_date || dbProject.created_at,
              endDate: dbProject.end_date || dbProject.updated_at,
              managerId: dbProject.managerId || '',
              createdAt: dbProject.created_at,
              updatedAt: dbProject.updated_at,
              teamMemberIds: Array.isArray(dbProject.teamMemberIds) ? dbProject.teamMemberIds : [],
              budget: dbProject.budget || 0,
              budgetSpent: dbProject.budget_spent || 0,
              isCompleted: dbProject.is_completed || false,
              status: dbProject.status as Project['status'] || 'To Do',
              tasksCount: dbProject.tasks_count || 0,
              tags: Array.isArray(dbProject.tags) ? dbProject.tags : [],
              organizationId: dbProject.organizationId || '',
              comments: Array.isArray(comments) ? comments : []
            };
          } catch (commentError) {
            console.warn('Failed to fetch comments for project:', dbProject.id, commentError);
            return {
              id: dbProject.id || '',
              title: dbProject.title || '',
              description: dbProject.description || '',
              startDate: dbProject.start_date || dbProject.created_at,
              endDate: dbProject.end_date || dbProject.updated_at,
              managerId: dbProject.managerId || '',
              createdAt: dbProject.created_at,
              updatedAt: dbProject.updated_at,
              teamMemberIds: Array.isArray(dbProject.teamMemberIds) ? dbProject.teamMemberIds : [],
              budget: dbProject.budget || 0,
              budgetSpent: dbProject.budget_spent || 0,
              isCompleted: dbProject.is_completed || false,
              status: dbProject.status as Project['status'] || 'To Do',
              tasksCount: dbProject.tasks_count || 0,
              tags: Array.isArray(dbProject.tags) ? dbProject.tags : [],
              organizationId: dbProject.organizationId || '',
              comments: []
            };
          }
        })
      );

      setProjects(transformedProjects);
      setError(null);
      
      console.log('useProjects: Successfully processed projects:', {
        originalCount: data?.length || 0,
        validatedCount: validatedProjects.length,
        transformedCount: transformedProjects.length,
        userId: user.id,
        role: user.role
      });
      
    } catch (err: any) {
      console.error('useProjects: Fetch error:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      
      setError(errorMessage);
      
      // Ensure projects is always an array, even on error
      setProjects([]);
      
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
        organizationId: data.organization_id,
        comments: [] // New projects start with no comments
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
