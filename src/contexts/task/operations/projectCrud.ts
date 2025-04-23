import { User, Project, Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

export const addProject = async (
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>,
  user: User | null,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;
    
    const now = new Date();
    const projectId = uuidv4();
    
    const projectToInsert = {
      id: projectId,
      title: project.title,
      description: project.description,
      start_date: project.startDate.toISOString(),
      end_date: project.endDate.toISOString(),
      manager_id: user.id,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      budget: project.budget
    };
    
    const { error } = await supabase
      .from('projects')
      .insert(projectToInsert);
    
    if (error) {
      console.error('Error adding project:', error);
      playErrorSound();
      toast.error('Failed to create project');
      return;
    }
    
    const teamMembers = project.teamMembers || [];
    const teamMemberPromises = teamMembers.map(userId => 
      supabase
        .from('project_team_members')
        .insert({ 
          project_id: projectId, 
          user_id: userId 
        })
    );
    
    if (teamMemberPromises.length > 0) {
      await Promise.all(teamMemberPromises);
    }
    
    const newProject: Project = {
      id: projectId,
      title: project.title,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      managerId: user.id,
      createdAt: now,
      updatedAt: now,
      tasks: [],
      teamMembers,
      budget: project.budget,
      budgetSpent: 0,
      is_completed: false
    };
    
    setProjects(prevProjects => [...prevProjects, newProject]);
    playSuccessSound();
    toast.success('Project created successfully!');
  } catch (error) {
    console.error('Error in addProject:', error);
    playErrorSound();
    toast.error('Failed to create project');
  }
};

export const updateProject = async (
  projectId: string,
  updates: Partial<Project>,
  user: User | null,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;
    
    const now = new Date();
    const updatedFields: any = {
      updated_at: now.toISOString()
    };
    
    if (updates.title !== undefined) updatedFields.title = updates.title;
    if (updates.description !== undefined) updatedFields.description = updates.description;
    if (updates.startDate !== undefined) updatedFields.start_date = updates.startDate.toISOString();
    if (updates.endDate !== undefined) updatedFields.end_date = updates.endDate.toISOString();
    if (updates.budget !== undefined) updatedFields.budget = updates.budget;
    if (updates.is_completed !== undefined) updatedFields.is_completed = updates.is_completed;
    
    const { error } = await supabase
      .from('projects')
      .update(updatedFields)
      .eq('id', projectId);
    
    if (error) {
      console.error('Error updating project:', error);
      playErrorSound();
      toast.error('Failed to update project');
      return;
    }
    
    if (updates.teamMembers) {
      const { data: currentMembers } = await supabase
        .from('project_team_members')
        .select('user_id')
        .eq('project_id', projectId);
      
      const currentMemberIds = currentMembers ? currentMembers.map(m => m.user_id) : [];
      const newMemberIds = updates.teamMembers || [];
      
      const membersToAdd = newMemberIds.filter(id => !currentMemberIds.includes(id));
      const membersToRemove = currentMemberIds.filter(id => !newMemberIds.includes(id));
      
      for (const userId of membersToAdd) {
        const { error } = await supabase
          .from('project_team_members')
          .insert({ project_id: projectId, user_id: userId });
          
        if (error) {
          console.error('Error adding team member during update:', error);
        }
      }
      
      if (membersToRemove.length > 0) {
        const { error } = await supabase
          .from('project_team_members')
          .delete()
          .eq('project_id', projectId)
          .in('user_id', membersToRemove);
          
        if (error) {
          console.error('Error removing team members during update:', error);
        }
      }
    }
    
    setProjects(prevProjects => prevProjects.map(project => {
      if (project.id === projectId) {
        return { ...project, ...updates, updatedAt: now };
      }
      return project;
    }));
    
    toast.success('Project updated successfully!');
  } catch (error) {
    console.error('Error in updateProject:', error);
    playErrorSound();
    toast.error('Failed to update project');
  }
};

export const deleteProject = async (
  projectId: string,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;
    
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    
    for (const task of projectTasks) {
      const { error } = await supabase
        .from('tasks')
        .update({ project_id: null })
        .eq('id', task.id);
        
      if (error) {
        console.error('Error updating task:', error);
      }
    }
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (error) {
      console.error('Error deleting project:', error);
      playErrorSound();
      toast.error('Failed to delete project');
      return;
    }
    
    setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
    
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.projectId === projectId) {
        return { ...task, projectId: undefined };
      }
      return task;
    }));
    
    toast.success('Project deleted successfully!');
  } catch (error) {
    console.error('Error in deleteProject:', error);
    playErrorSound();
    toast.error('Failed to delete project');
  }
};
