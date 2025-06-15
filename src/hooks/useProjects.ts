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
      
      const data = await requestManager.dedupe(cacheKey, async () => {
        console.log('useProjects: Fetching STRICTLY accessible projects for user:', {
          userId: user.id,
          userRole: user.role,
          organizationId: user.organizationId
        });
        
        // Extended timeout from 10s to 20s for better reliability
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 20 seconds')), 20000)
        );

        const projectPromise = supabase
          .from('projects')
          .select('*')
          .order('updated_at', { ascending: false });

        const { data, error } = await Promise.race([
          projectPromise,
          timeoutPromise
        ]) as any;

        if (error) {
          console.error('useProjects: STRICT RLS Policy Error fetching projects:', error);
          
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

        console.log('useProjects: STRICT RLS returned accessible projects:', {
          userId: user.id,
          userRole: user.role,
          projectCount: data?.length || 0,
          timestamp: new Date().toISOString()
        });

        return data;
      });

      // Security validation: Ensure all returned projects should be accessible by this user
      const validatedProjects = data?.filter(dbProject => {
        if (dbProject.organization_id !== user.organizationId) {
          console.error('useProjects: SECURITY VIOLATION - Project from different organization leaked:', {
            projectId: dbProject.id,
            projectOrg: dbProject.organization_id,
            userOrg: user.organizationId
          });
          return false;
        }

        // Additional access validation logging
        const hasDirectAccess = 
          dbProject.manager_id === user.id || // Project manager
          (dbProject.team_members && dbProject.team_members.includes(user.id)) || // Team member
          user.role === 'admin' || user.role === 'superadmin'; // Admin access

        if (!hasDirectAccess) {
          console.error('useProjects: SECURITY VIOLATION - User should not have access to this project:', {
            projectId: dbProject.id,
            userId: user.id,
            userRole: user.role,
            projectManager: dbProject.manager_id,
            teamMembers: dbProject.team_members
          });
          return false;
        }

        // Log successful access validation
        const accessReason = 
          dbProject.manager_id === user.id ? 'PROJECT_MANAGER' :
          (dbProject.team_members && dbProject.team_members.includes(user.id)) ? 'TEAM_MEMBER' :
          user.role === 'admin' || user.role === 'superadmin' ? 'ADMIN_ACCESS' : 'UNKNOWN';

        console.log('useProjects: Processing STRICTLY accessible project:', {
          projectId: dbProject.id,
          projectTitle: dbProject.title,
          userId: user.id,
          userRole: user.role,
          accessReason: accessReason
        });

        return true;
      }) || [];

      // Transform database projects to match Project type
      const transformedProjects: Project[] = validatedProjects.map(dbProject => {
        return {
          id: dbProject.id,
          title: dbProject.title || '',
          description: dbProject.description || '',
          startDate: new Date(dbProject.start_date || dbProject.created_at),
          endDate: new Date(dbProject.end_date || dbProject.updated_at),
          managerId: dbProject.manager_id || '',
          createdAt: new Date(dbProject.created_at),
          updatedAt: new Date(dbProject.updated_at),
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
      
      console.log('useProjects: Successfully processed STRICTLY accessible projects:', {
        originalCount: data?.length || 0,
        validatedCount: validatedProjects.length,
        transformedCount: transformedProjects.length,
        userId: user.id,
        role: user.role,
        accessType: 'STRICT_RLS_MANAGER_TEAM_ADMIN_ONLY'
      });
      
    } catch (err: any) {
      console.error('useProjects: Fetch error:', err);
      const errorMessage = err.message;
      
      setError(errorMessage);
      
      // Improved user-friendly error messages
      if (errorMessage.includes('Network connection issue')) {
        console.warn('Network connection issue detected - data may be cached');
      } else if (errorMessage.includes('permission')) {
        console.warn('Permission issue - user may not have access to any projects');
      } else {
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
        startDate: new Date(data.start_date || data.created_at),
        endDate: new Date(data.end_date || data.updated_at),
        managerId: data.manager_id || '',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
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

    console.log('useProjects: Setting up real-time subscription with STRICT RLS filtering');
    const channel = supabase
      .channel('projects_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          console.log('useProjects: Real-time update received (will be filtered by STRICT RLS):', payload);
          fetchProjects(); // Refetch to ensure proper authorization
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
