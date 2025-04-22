
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
      updated_at: now.toISOString()
    };
    
    console.log('Inserting project with manager_id:', projectToInsert.manager_id);
    
    const { data, error } = await supabase
      .from('projects')
      .insert(projectToInsert)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error adding project:', error);
      playErrorSound();
      toast.error('Failed to create project');
      return;
    }
    
    // For now, we won't be able to store team members in the database until we set up the project_team_members table
    // But we can still track them in local state
    const teamMembers = project.teamMembers || [];
    
    if (data) {
      const newProject: Project = {
        id: data.id,
        title: data.title,
        description: data.description,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        managerId: data.manager_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        tasks: [],
        teamMembers,
        tags: [],
        status: project.status || 'To Do', // Add the status property with default
        budget: project.budget,
        budgetSpent: data.budget_spent || 0,
        is_completed: data.is_completed || false
      };
      
      setProjects(prevProjects => [...prevProjects, newProject]);
      playSuccessSound();
      toast.success('Project created successfully!');
    }
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

    console.log('Deleting project with ID:', projectId);
    
    // Find all tasks belonging to this project
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    console.log(`Found ${projectTasks.length} tasks associated with this project`);
    
    // Update the tasks to remove project association
    for (const task of projectTasks) {
      const { error } = await supabase
        .from('tasks')
        .update({ project_id: null })
        .eq('id', task.id);
        
      if (error) {
        console.error('Error updating task:', error);
      }
    }

    // Also delete tasks from project_tasks table to ensure no orphaned tasks
    const { error: projectTasksError } = await supabase
      .from('project_tasks')
      .delete()
      .eq('project_id', projectId);
    
    if (projectTasksError) {
      console.error('Error deleting project tasks:', projectTasksError);
    }
    
    // Delete the project
    const { error, count } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (error) {
      console.error('Error deleting project:', error);
      playErrorSound();
      toast.error('Failed to delete project');
      return;
    }

    console.log(`Deleted ${count} project records from database`);
    
    // Immediately update state to remove the project
    setProjects(prevProjects => {
      const filteredProjects = prevProjects.filter(project => project.id !== projectId);
      console.log(`Removed project from state. Projects count: ${filteredProjects.length}`);
      return filteredProjects;
    });
    
    // Update tasks to remove project association in the local state
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.projectId === projectId) {
        return { ...task, projectId: undefined };
      }
      return task;
    }));
    
    playSuccessSound();
    toast.success('Project deleted successfully!');
  } catch (error) {
    console.error('Error in deleteProject:', error);
    playErrorSound();
    toast.error('Failed to delete project');
  }
};

