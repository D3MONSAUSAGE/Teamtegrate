
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

      setProjects(data || []);
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
      setProjects(prev => [data, ...prev]);
      toast.success('Project created successfully');
      return data;
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
    error,
    fetchProjects,
    createProject,
    deleteProject,
    setProjects
  };
}
