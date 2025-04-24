
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
      // Generate a unique ID for the project
      const projectId = crypto.randomUUID();
      const now = new Date().toISOString();

      console.log('Creating project with data:', {
        id: projectId,
        title: project.title,
        description: project.description,
        start_date: project.startDate.toISOString(),
        end_date: project.endDate.toISOString(),
        manager_id: user.id,
        budget: project.budget || 0,
        is_completed: false,
        created_at: now,
        updated_at: now,
        team_members: project.teamMembers || []
      });

      const { data, error } = await supabase
        .from('projects')
        .insert({
          id: projectId,
          title: project.title,
          description: project.description,
          start_date: project.startDate.toISOString(),
          end_date: project.endDate.toISOString(),
          manager_id: user.id,
          budget: project.budget || 0,
          is_completed: false,
          created_at: now,
          updated_at: now,
          team_members: project.teamMembers || []
        })
        .select();

      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }

      console.log('Project created successfully:', data);
      toast.success('Project created successfully');
      return data[0];
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
