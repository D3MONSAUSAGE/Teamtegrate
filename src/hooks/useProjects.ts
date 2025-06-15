
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Project } from '@/types';
import { toast } from 'sonner';

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
      console.log('useProjects: Fetching authorized projects for user:', {
        userId: user.id,
        userRole: user.role,
        organizationId: user.organizationId
      });
      
      // With new RLS policies, this will only return projects the user is authorized to see
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('useProjects: Error fetching projects:', error);
        throw error;
      }

      console.log('useProjects: Successfully fetched authorized projects:', {
        userId: user.id,
        userRole: user.role,
        projectCount: data?.length || 0,
        projectIds: data?.map(p => p.id).slice(0, 5) || [], // Log first 5 project IDs
        timestamp: new Date().toISOString()
      });

      // Log access for security audit
      if (data && data.length > 0) {
        console.log('useProjects: Security audit - Project access granted:', {
          userId: user.id,
          userRole: user.role,
          projectsAccessible: data.length,
          accessReason: user.role === 'admin' || user.role === 'superadmin' 
            ? 'Admin role access' 
            : 'Manager or team member access',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('useProjects: Security audit - No projects accessible:', {
          userId: user.id,
          userRole: user.role,
          reason: 'User is not manager, team member, or admin of any projects',
          timestamp: new Date().toISOString()
        });
      }

      // Transform database projects to match Project type
      const transformedProjects: Project[] = data?.map(dbProject => ({
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
      })) || [];

      setProjects(transformedProjects);
      setError(null);
    } catch (err: any) {
      console.error('useProjects: Fetch error:', err);
      setError(err.message);
      toast.error('Failed to load projects - you may not have access to any projects');
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
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title,
          description,
          start_date: startDate,
          end_date: endDate,
          budget,
          manager_id: user.id,
          organization_id: user.organizationId,
          team_members: [user.id] // Add creator as team member
        })
        .select()
        .single();

      if (error) {
        console.error('useProjects: Error creating project:', error);
        throw error;
      }
      
      console.log('useProjects: Successfully created project:', data);
      
      // Transform the created project to match Project type
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

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    console.log('useProjects: Setting up real-time subscription');
    const channel = supabase
      .channel('projects_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          console.log('useProjects: Real-time update received:', payload);
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
    isLoading: loading, // Add alias for backward compatibility
    error,
    fetchProjects,
    refetch: fetchProjects, // Add alias for backward compatibility
    refreshProjects: fetchProjects, // Add alias for backward compatibility
    createProject,
    deleteProject,
    setProjects
  };
}
