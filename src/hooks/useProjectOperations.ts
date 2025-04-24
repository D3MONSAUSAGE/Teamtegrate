
import { useState } from 'react';
import { Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';

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
      const projectId = uuidv4();
      const now = new Date();
      const nowISO = now.toISOString();

      console.log('Creating project with data:', {
        id: projectId,
        title: project.title,
        description: project.description,
        start_date: project.startDate.toISOString(),
        end_date: project.endDate.toISOString(),
        manager_id: user.id,
        budget: project.budget || 0,
        is_completed: false,
        created_at: nowISO,
        updated_at: nowISO,
        team_members: project.teamMembers || []
      });

      const { error } = await supabase
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
          created_at: nowISO,
          updated_at: nowISO,
          team_members: project.teamMembers || []
        });

      if (error) {
        console.error('Error creating project:', error);
        toast.error('Failed to create project');
        return null;
      }

      // Create a local project object to return
      const newProject: Project = {
        id: projectId,
        title: project.title,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        managerId: user.id,
        budget: project.budget || 0,
        createdAt: now,
        updatedAt: now,
        tasks: [],
        teamMembers: project.teamMembers || [],
        is_completed: false,
        budgetSpent: 0
      };

      console.log('Project created successfully:', newProject);
      toast.success('Project created successfully');
      return newProject;
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
