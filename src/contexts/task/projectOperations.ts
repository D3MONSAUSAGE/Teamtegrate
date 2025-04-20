
import { Project, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { v4 as uuidv4 } from 'uuid';

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
      manager_id: user.id,
      title: project.title,
      description: project.description,
      start_date: project.startDate.toISOString(),
      end_date: project.endDate.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      budget: project.budget || null,
      is_completed: false,
      budget_spent: 0
    };

    // Insert the project
    const { error } = await supabase
      .from('projects')
      .insert(projectToInsert);

    if (error) {
      console.error('Error adding project:', error);
      playErrorSound();
      toast.error('Failed to create project');
      return;
    }

    // Create tasks if any
    if (project.tasks && project.tasks.length > 0) {
      const tasksToInsert = project.tasks.map(task => {
        const taskId = uuidv4();
        return {
          id: taskId,
          user_id: user.id,
          project_id: projectId,
          title: task.title,
          description: task.description,
          deadline: task.deadline.toISOString(),
          priority: task.priority,
          status: task.status || 'To Do',
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        };
      });

      const { error: tasksError } = await supabase
        .from('project_tasks')
        .insert(tasksToInsert);

      if (tasksError) {
        console.error('Error adding project tasks:', tasksError);
        toast.error('Project created but failed to add tasks');
      }
    }

    // Add team members if any
    if (project.teamMembers && project.teamMembers.length > 0) {
      // Logic to add team members would go here
      // This would typically involve creating records in a project_team_members table
    }

    // Add project to local state with proper task structure
    setProjects(prevProjects => {
      const formattedTasks = project.tasks ? project.tasks.map(task => ({
        id: uuidv4(),
        userId: user.id,
        projectId,
        title: task.title,
        description: task.description || '',
        deadline: task.deadline,
        priority: task.priority || 'Medium',
        status: task.status || 'To Do',
        createdAt: now,
        updatedAt: now,
        assignedToId: undefined,
        assignedToName: undefined,
        completedAt: undefined,
        tags: [],
        comments: [],
        cost: 0
      })) : [];

      const newProject = {
        id: projectId,
        title: project.title,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        managerId: user.id,
        createdAt: now,
        updatedAt: now,
        tasks: formattedTasks,
        teamMembers: project.teamMembers || [],
        tags: [],
        budget: project.budget,
        budgetSpent: 0,
        is_completed: false
      };

      return [...prevProjects, newProject];
    });

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
    if (updates.startDate !== undefined) updatedFields.start_date = (updates.startDate instanceof Date ? updates.startDate : new Date(updates.startDate)).toISOString();
    if (updates.endDate !== undefined) updatedFields.end_date = (updates.endDate instanceof Date ? updates.endDate : new Date(updates.endDate)).toISOString();
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
  tasks: any[],
  setTasks: React.Dispatch<React.SetStateAction<any[]>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

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

    // Remove project from local state
    setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
    
    // Remove project tasks from tasks array
    setTasks(prevTasks => prevTasks.filter(task => task.projectId !== projectId));

    toast.success('Project deleted successfully!');
  } catch (error) {
    console.error('Error in deleteProject:', error);
    playErrorSound();
    toast.error('Failed to delete project');
  }
};

export const addTeamMemberToProject = async (
  projectId: string,
  userId: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  // This would typically involve inserting a record into a project_team_members table
  // For now, we'll just update the local state
  setProjects(prevProjects => prevProjects.map(project => {
    if (project.id === projectId) {
      return {
        ...project,
        teamMembers: [...(project.teamMembers || []), userId]
      };
    }
    return project;
  }));
};

export const removeTeamMemberFromProject = async (
  projectId: string,
  userId: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  // This would typically involve removing a record from a project_team_members table
  // For now, we'll just update the local state
  setProjects(prevProjects => prevProjects.map(project => {
    if (project.id === projectId) {
      return {
        ...project,
        teamMembers: (project.teamMembers || []).filter(id => id !== userId)
      };
    }
    return project;
  }));
};
