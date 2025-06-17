
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

  const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !user.organizationId) {
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
      const budget = project.budget ?? 0;

      // Handle date conversion properly with explicit type checking
      let startDateString = nowISO;
      if (project.startDate) {
        if (typeof project.startDate === 'string') {
          startDateString = project.startDate;
        } else if (project.startDate instanceof Date) {
          startDateString = project.startDate.toISOString();
        }
      }

      let endDateString = nowISO;
      if (project.endDate) {
        if (typeof project.endDate === 'string') {
          endDateString = project.endDate;
        } else if (project.endDate instanceof Date) {
          endDateString = project.endDate.toISOString();
        }
      }

      console.log('Creating project with data:', {
        id: projectId,
        title: project.title,
        description: project.description,
        start_date: startDateString,
        end_date: endDateString,
        manager_id: user.id,
        budget: budget,
        is_completed: false,
        created_at: nowISO,
        updated_at: nowISO,
        team_members: project.teamMemberIds || [],
        status: project.status || 'To Do',
        tasks_count: 0,
        organization_id: user.organizationId
      });

      const { error } = await supabase
        .from('projects')
        .insert({
          id: projectId,
          title: project.title,
          description: project.description,
          start_date: startDateString,
          end_date: endDateString,
          manager_id: user.id,
          budget: budget,
          is_completed: false,
          created_at: nowISO,
          updated_at: nowISO,
          team_members: project.teamMemberIds || [],
          status: project.status || 'To Do',
          tasks_count: 0,
          organization_id: user.organizationId
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
        startDate: startDateString,
        endDate: endDateString,
        managerId: user.id,
        budget: budget,
        createdAt: nowISO,
        updatedAt: nowISO,
        teamMemberIds: project.teamMemberIds || [],
        isCompleted: false,
        budgetSpent: 0,
        status: project.status as ProjectStatus,
        tasksCount: 0,
        tags: [],
        organizationId: user.organizationId
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
