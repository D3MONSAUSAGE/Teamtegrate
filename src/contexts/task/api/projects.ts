
import { Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const fetchProjects = async (organizationId: string): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;

    return (data || []).map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      startDate: project.start_date ? new Date(project.start_date).toISOString() : new Date().toISOString(),
      endDate: project.end_date ? new Date(project.end_date).toISOString() : new Date().toISOString(),
      status: project.status as 'To Do' | 'In Progress' | 'Completed',
      budget: project.budget || 0,
      budgetSpent: project.budget_spent || 0,
      managerId: project.manager_id,
      teamMemberIds: project.team_members || [],
      tags: project.tags || [],
      createdAt: project.created_at ? new Date(project.created_at).toISOString() : new Date().toISOString(),
      updatedAt: project.updated_at ? new Date(project.updated_at).toISOString() : new Date().toISOString(),
      isCompleted: project.is_completed || false,
      organizationId: project.organization_id,
      tasksCount: project.tasks_count || 0,
      comments: []
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const createProject = async (projectData: {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  organizationId: string;
}): Promise<Project> => {
  try {
    const projectId = uuidv4();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        title: projectData.title,
        description: projectData.description,
        start_date: projectData.startDate ? new Date(projectData.startDate).toISOString() : now,
        end_date: projectData.endDate ? new Date(projectData.endDate).toISOString() : now,
        budget: projectData.budget || 0,
        organization_id: projectData.organizationId,
        created_at: now,
        updated_at: now,
        status: 'To Do',
        is_completed: false,
        tasks_count: 0
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      startDate: new Date(data.start_date).toISOString(),
      endDate: new Date(data.end_date).toISOString(),
      status: data.status as 'To Do' | 'In Progress' | 'Completed',
      budget: data.budget || 0,
      budgetSpent: data.budget_spent || 0,
      managerId: data.manager_id,
      teamMemberIds: data.team_members || [],
      tags: data.tags || [],
      createdAt: new Date(data.created_at).toISOString(),
      updatedAt: new Date(data.updated_at).toISOString(),
      isCompleted: data.is_completed || false,
      organizationId: data.organization_id,
      tasksCount: data.tasks_count || 0,
      comments: []
    };
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.startDate) updateData.start_date = new Date(updates.startDate).toISOString();
    if (updates.endDate) updateData.end_date = new Date(updates.endDate).toISOString();
    if (updates.budget !== undefined) updateData.budget = updates.budget;
    if (updates.status) updateData.status = updates.status;
    if (updates.teamMemberIds) updateData.team_members = updates.teamMemberIds;

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};
