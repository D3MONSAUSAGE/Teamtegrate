
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
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }
    
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
      budget: project.budget,
      is_completed: false
    };
    
    // First insert the project
    const { error: projectError } = await supabase
      .from('projects')
      .insert(projectToInsert);
    
    if (projectError) {
      console.error('Error adding project:', projectError);
      playErrorSound();
      toast.error('Failed to create project');
      return;
    }
    
    // Process team members after project creation is successful
    const teamMembers = project.teamMembers || [];
    if (teamMembers.length > 0) {
      const teamMemberInsertData = teamMembers.map(userId => ({
        project_id: projectId,
        user_id: userId
      }));
      
      const { error: membersError } = await supabase
        .from('project_team_members')
        .insert(teamMemberInsertData);
        
      if (membersError) {
        console.error('Error adding team members:', membersError);
        toast.error('Project created but had issues adding some team members');
      }
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
    if (!user) {
      toast.error('You must be logged in to update a project');
      return;
    }
    
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
    
    if (updates.teamMembers !== undefined) {
      try {
        // First get current team members
        const { data: currentMembers } = await supabase
          .from('project_team_members')
          .select('user_id')
          .eq('project_id', projectId);
        
        const currentMemberIds = currentMembers ? currentMembers.map(m => m.user_id) : [];
        const newMemberIds = updates.teamMembers || [];
        
        // Determine members to add and remove
        const membersToAdd = newMemberIds.filter(id => !currentMemberIds.includes(id));
        const membersToRemove = currentMemberIds.filter(id => !newMemberIds.includes(id));
        
        // Add new members
        if (membersToAdd.length > 0) {
          const newMembersData = membersToAdd.map(userId => ({
            project_id: projectId,
            user_id: userId
          }));
          
          const { error: addError } = await supabase
            .from('project_team_members')
            .insert(newMembersData);
            
          if (addError) {
            console.error('Error adding new team members:', addError);
          }
        }
        
        // Remove members that are no longer on the team
        if (membersToRemove.length > 0) {
          for (const userId of membersToRemove) {
            const { error: removeError } = await supabase
              .from('project_team_members')
              .delete()
              .eq('project_id', projectId)
              .eq('user_id', userId);
              
            if (removeError) {
              console.error('Error removing team member:', removeError);
            }
          }
        }
      } catch (teamError) {
        console.error('Error managing team members:', teamError);
        toast.error('Project updated but had issues updating team members');
      }
    }
    
    // Update local state
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
    if (!user) {
      toast.error('You must be logged in to delete a project');
      return;
    }
    
    // First update any tasks associated with this project to remove the project reference
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
    
    // Now delete the project
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
    
    // Team members will be automatically deleted due to ON DELETE CASCADE
    
    // Update local state
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
