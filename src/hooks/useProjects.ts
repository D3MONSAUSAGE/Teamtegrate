
import { useState, useEffect } from 'react';
import { Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        console.log('No user found, skipping project fetch');
        setProjects([]);
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching projects for user:', user.id);
      
      // Using a simplified query approach to avoid RLS recursion
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('manager_id', user.id);

      if (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
        toast.error('Failed to load projects');
        return;
      }

      console.log('Projects fetched:', data);

      const formattedProjects: Project[] = data.map(project => ({
        id: project.id,
        title: project.title || '',
        description: project.description || '',
        startDate: project.start_date ? new Date(project.start_date) : new Date(),
        endDate: project.end_date ? new Date(project.end_date) : new Date(),
        managerId: project.manager_id || '',
        createdAt: project.created_at ? new Date(project.created_at) : new Date(),
        updatedAt: project.updated_at ? new Date(project.updated_at) : new Date(),
        tasks: [],
        teamMembers: project.team_members || [],
        budget: project.budget || 0,
        budgetSpent: project.budget_spent || 0,
        is_completed: project.is_completed || false
      }));

      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setIsLoading(false);
    }
  }, [user]);

  return {
    projects,
    isLoading,
    refreshProjects: fetchProjects
  };
};
