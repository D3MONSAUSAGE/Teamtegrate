
import { useState, useEffect } from 'react';
import { supabase, checkSessionHealth } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Project } from '@/types';
import { toast } from '@/components/ui/sonner';
import { useSessionGuard } from '@/hooks/useSessionGuard';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { checkAndRecoverSession } = useSessionGuard();

  const fetchProjects = async (retryCount = 0) => {
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
        organizationId: user.organizationId,
        attempt: retryCount + 1
      });
      
      setIsLoading(true);
      setError(null);

      // Check session health before querying
      if (retryCount === 0) {
        const healthCheck = await checkSessionHealth();
        if (!healthCheck.healthy) {
          console.log('⚠️ Session unhealthy before projects query, attempting recovery...');
          const recovered = await checkAndRecoverSession();
          if (recovered) {
            console.log('✅ Session recovered, retrying projects fetch...');
            return fetchProjects(retryCount + 1);
          } else {
            throw new Error('Session recovery failed. Please log out and back in.');
          }
        }
      }
      
      // With the clean RLS policies, simply select all projects
      console.log('📋 Executing projects query with session-guarded clean RLS filtering...');
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Error fetching projects:', fetchError);
        
        // Check if it's an RLS/permission error
        if (fetchError.message?.includes('policy') || fetchError.message?.includes('permission')) {
          console.log('🔧 RLS policy error detected, attempting session recovery...');
          if (retryCount === 0) {
            const recovered = await checkAndRecoverSession();
            if (recovered) {
              console.log('✅ Session recovered after RLS error, retrying...');
              return fetchProjects(retryCount + 1);
            }
          }
          throw new Error('Unable to access projects. Session may be expired. Please refresh the page or log out and back in.');
        }
        
        throw fetchError;
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} projects with session-guarded clean RLS`);

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

      console.log('📋 Session-guarded projects processed:', transformedProjects.map(p => ({
        id: p.id,
        title: p.title,
        organizationId: p.organizationId
      })));

      setProjects(transformedProjects);
    } catch (err: any) {
      console.error('❌ Error in fetchProjects with session guard:', err);
      setError(err.message || 'Failed to fetch projects');
      
      // Show user-friendly error messages
      if (err.message?.includes('Session') || err.message?.includes('expired')) {
        toast.error('Session expired. Please refresh the page or log out and back in.');
      } else {
        toast.error('Failed to load projects: ' + (err.message || 'Unknown error'));
      }
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
