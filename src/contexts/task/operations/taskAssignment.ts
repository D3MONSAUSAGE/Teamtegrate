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
    const originalProjectId = task?.projectId;

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

    // Update the task in the tasks array
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, projectId, updatedAt: now };
      }
      return task;
    }));

    // Handle project assignments
    setProjects(prevProjects => {
      return prevProjects.map(project => {
        // If this is the old project, remove the task
        if (project.id === originalProjectId) {
          return {
            ...project,
            tasks: project.tasks.filter(task => task.id !== taskId)
          };
        }
        
        // If this is the new project, add the task
        if (project.id === projectId) {
          const taskToAdd = allTasks.find(t => t.id === taskId);
          if (taskToAdd) {
            // Make a copy with the new project ID
            const updatedTask = { ...taskToAdd, projectId, updatedAt: now };
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
    const projectId = task?.projectId;
    
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
