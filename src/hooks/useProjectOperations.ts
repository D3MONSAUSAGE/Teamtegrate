
import { useState } from 'react';
import { Project, ProjectStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

export const useProjectOperations = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => {
    if (!user || !user.organization_id) {
      toast.error('You must be logged in and belong to an organization to create a project');
      playErrorSound();
      return null;
    }

    setIsLoading(true);
    try {
      // Generate a unique ID for the project
      const projectId = uuidv4();
      const now = new Date();
      const nowISO = now.toISOString();

      // Prepare budget value - handle undefined or null case
      const budget = project.budget ?? 0; // Use nullish coalescing to default to 0 if undefined or null

      console.log('Creating project with data:', {
        id: projectId,
        title: project.title,
        description: project.description,
        start_date: project.startDate.toISOString(),
        end_date: project.endDate.toISOString(),
        manager_id: user.id,
        budget: budget,
        is_completed: false,
        created_at: nowISO,
        updated_at: nowISO,
        team_members: project.teamMembers || [],
        status: project.status || 'To Do',
        tasks_count: 0,
        organization_id: user.organization_id
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
          budget: budget, // Using the prepared value
          is_completed: false,
          created_at: nowISO,
          updated_at: nowISO,
          team_members: project.teamMembers || [],
          status: project.status || 'To Do',
          tasks_count: 0,
          organization_id: user.organization_id
        });

      if (error) {
        console.error('Error creating project:', error);
        toast.error('Failed to create project: ' + error.message);
        playErrorSound();
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
        budget: budget, // Using the prepared value
        createdAt: now,
        updatedAt: now,
        tasks: [],
        teamMembers: project.teamMembers || [],
        is_completed: false,
        budgetSpent: 0,
        status: project.status as ProjectStatus,
        tasks_count: 0,
        tags: []
      };

      console.log('Project created successfully:', newProject);
      toast.success('Project created successfully');
      playSuccessSound();
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
      playErrorSound();
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
