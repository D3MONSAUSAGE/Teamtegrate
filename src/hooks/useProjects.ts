
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Project } from '@/types';
import { toast } from '@/components/ui/sonner';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const fetchProjects = async () => {
    if (!user || !isAuthenticated) {
      console.log('📋 No authenticated user, skipping project fetch');
      setIsLoading(false);
      setProjects([]);
      return;
    }

    try {
      console.log('📋 Fetching projects for user:', {
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId
      });
      
      setIsLoading(true);
      setError(null);
      
      // With new RLS policies, simply select all projects
      // The RLS policy will automatically filter by organization
      console.log('📋 Executing projects query with RLS filtering...');
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Error fetching projects:', fetchError);
        throw fetchError;
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} projects`);

      if (!data || data.length === 0) {
        console.log('📋 No projects found');
        setProjects([]);
        return;
      }

      // Transform the data to match our Project interface
      const transformedProjects: Project[] = data.map(project => ({
        id: project.id,
        title: project.title || '',
        description: project.description || '',
        startDate: project.start_date ? new Date(project.start_date) : new Date(project.created_at || new Date()),
        endDate: project.end_date ? new Date(project.end_date) : new Date(),
        managerId: project.manager_id || '',
        createdAt: new Date(project.created_at || new Date()),
        updatedAt: new Date(project.updated_at || new Date()),
        teamMemberIds: Array.isArray(project.team_members) ? project.team_members.map(id => String(id)) : [],
        budget: Number(project.budget) || 0,
        budgetSpent: Number(project.budget_spent) || 0,
        isCompleted: Boolean(project.is_completed),
        status: project.status as Project['status'] || 'To Do',
        tasksCount: Number(project.tasks_count) || 0,
        tags: Array.isArray(project.tags) ? project.tags : [],
        organizationId: user.organizationId
      }));

      console.log('📋 Transformed projects:', transformedProjects.map(p => ({
        id: p.id,
        title: p.title,
        organizationId: p.organizationId
      })));

      setProjects(transformedProjects);
    } catch (err: any) {
      console.error('❌ Error in fetchProjects:', err);
      setError(err.message || 'Failed to fetch projects');
      toast.error('Failed to load projects: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProjects = async () => {
    await fetchProjects();
  };

  useEffect(() => {
    fetchProjects();
  }, [user?.id, isAuthenticated]);

  return {
    projects,
    isLoading,
    error,
    refreshProjects
  };
};
