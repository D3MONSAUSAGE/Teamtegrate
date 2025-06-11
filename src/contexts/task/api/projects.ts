
import { Project, User, ProjectStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { addOrgIdToInsert, validateUserOrganization } from '@/utils/organizationHelpers';

export const addProject = async (
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>,
  user: { id: string; organization_id?: string }
): Promise<Project | null> => {
  try {
    validateUserOrganization(user);
    
    // Generate a unique ID for the project
    const projectId = uuidv4();
    const now = new Date();
    const nowISO = now.toISOString();
    
    // Explicitly ensure status and is_completed are synchronized
    let status = project.status || 'To Do';
    let isCompleted = project.is_completed || false;
    
    // Always enforce consistency
    if (status === 'Completed') {
      isCompleted = true;
    } else if (isCompleted) {
      status = 'Completed';
    }
    
    console.log('Creating project with organization_id:', user.organization_id);
    
    const projectData = {
      id: projectId,
      title: project.title,
      description: project.description,
      start_date: project.startDate.toISOString(),
      end_date: project.endDate.toISOString(),
      manager_id: user.id,
      budget: project.budget || 0,
      is_completed: isCompleted,
      created_at: nowISO,
      updated_at: nowISO,
      team_members: project.teamMembers || [],
      status: status,
      tasks_count: 0,
      tags: project.tags || []
    };

    const insertData = addOrgIdToInsert(projectData, user);
    
    const { error } = await supabase
      .from('projects')
      .insert(insertData);

    if (error) {
      console.error('Error adding project:', error);
      toast.error('Failed to create project');
      playErrorSound();
      return null;
    }

    const newProject: Project = {
      id: projectId,
      title: project.title,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      managerId: user.id,
      budget: project.budget !== undefined ? project.budget : 0,
      createdAt: now,
      updatedAt: now,
      tasks: [],
      teamMembers: project.teamMembers || [],
      is_completed: isCompleted,
      budgetSpent: 0,
      status: status as ProjectStatus,
      tasks_count: 0,
      tags: project.tags || []
    };

    console.log('New project created:', newProject);
    toast.success('Project created successfully');
    playSuccessSound();
    return newProject;
  } catch (error) {
    console.error('Error in addProject:', error);
    toast.error('Failed to create project');
    playErrorSound();
    return null;
  }
};
