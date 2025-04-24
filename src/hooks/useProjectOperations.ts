
import { useState } from 'react';
import { Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

export const useProjectOperations = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => {
    if (!user) {
      toast.error('You must be logged in to create a project');
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: project.title,
          description: project.description,
          start_date: project.startDate.toISOString(),
          end_date: project.endDate.toISOString(),
          manager_id: user.id,
          budget: project.budget || 0,
          is_completed: false
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Project created successfully');
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createProject,
    isLoading
  };
};
