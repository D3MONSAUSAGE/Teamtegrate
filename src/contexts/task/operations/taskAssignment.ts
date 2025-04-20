
import { Task, User, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

export const assignTaskToProject = async (
  taskId: string,
  projectId: string,
  user: User | null,
  allTasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();

    // Find the task to get its current project ID
    const task = allTasks.find(t => t.id === taskId);
    if (!task) {
      console.error('Task not found:', taskId);
      return;
    }
    
    const originalProjectId = task.projectId;

    // First update the database
    const { error } = await supabase
      .from('tasks')
      .update({ project_id: projectId, updated_at: now.toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error assigning task to project:', error);
      playErrorSound();
      toast.error('Failed to assign task to project');
      return;
    }

    // Create a copy of the task with updated project ID
    const updatedTask = { ...task, projectId, updatedAt: now };
    
    // Update the local state for tasks
    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === taskId) {
        return updatedTask;
      }
      return t;
    }));

    // Now handle the project state updates - do this in a more predictable way
    setProjects(prevProjects => {
      // Create a new array to avoid mutation
      return prevProjects.map(project => {
        // If this is the old project and task was previously assigned to a project
        if (originalProjectId && project.id === originalProjectId) {
          return {
            ...project,
            tasks: project.tasks.filter(t => t.id !== taskId)
          };
        }
        
        // If this is the new project
        if (project.id === projectId) {
          // Check if the task is already in the project
          const taskExists = project.tasks.some(t => t.id === taskId);
          if (!taskExists) {
            return {
              ...project,
              tasks: [...project.tasks, updatedTask]
            };
          }
        }
        
        return project;
      });
    });

    toast.success('Task assigned to project successfully!');
  } catch (error) {
    console.error('Error in assignTaskToProject:', error);
    playErrorSound();
    toast.error('Failed to assign task to project');
  }
};

export const assignTaskToUser = async (
  taskId: string,
  userId: string,
  userName: string,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();

    // Only send assigned_to_id to the database
    const { error } = await supabase
      .from('tasks')
      .update({ assigned_to_id: userId, updated_at: now.toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error assigning task to user:', error);
      playErrorSound();
      toast.error('Failed to assign task to user');
      return;
    }

    // Find the task to get its project ID
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('Task not found:', taskId);
      return;
    }
    
    const projectId = task.projectId;
    
    // Update the task in the tasks array
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, assignedToId: userId, assignedToName: userName, updatedAt: now };
      }
      return task;
    }));
    
    // Also update the task in the project if needed
    if (projectId) {
      setProjects(prevProjects => {
        return prevProjects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              tasks: project.tasks.map(projectTask => {
                if (projectTask.id === taskId) {
                  return { 
                    ...projectTask, 
                    assignedToId: userId, 
                    assignedToName: userName,
                    updatedAt: now
                  };
                }
                return projectTask;
              })
            };
          }
          return project;
        });
      });
    }

    toast.success('Task assigned to user successfully!');
  } catch (error) {
    console.error('Error in assignTaskToUser:', error);
    playErrorSound();
    toast.error('Failed to assign task to user');
  }
};
