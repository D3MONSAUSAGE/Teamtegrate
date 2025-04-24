
import { Task, User, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playErrorSound } from '@/utils/sounds';

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
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
    if (updates.deadline !== undefined) updatedFields.deadline = (updates.deadline instanceof Date ? updates.deadline : new Date(updates.deadline)).toISOString();
    if (updates.priority !== undefined) updatedFields.priority = updates.priority;
    if (updates.status !== undefined) updatedFields.status = updates.status;
    if (updates.projectId !== undefined) updatedFields.project_id = updates.projectId;
    if (updates.assignedToId !== undefined) updatedFields.assigned_to_id = updates.assignedToId;
    if (updates.cost !== undefined) updatedFields.cost = updates.cost;

    const { error } = await supabase
      .from('tasks')
      .update(updatedFields)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      playErrorSound();
      toast.error('Failed to update task');
      return;
    }

    const originalTask = tasks.find(t => t.id === taskId);
    const originalProjectId = originalTask?.projectId;
    
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, ...updates, updatedAt: now };
      }
      return task;
    }));
    
    if (updates.projectId !== undefined && updates.projectId !== originalProjectId) {
      setProjects(prevProjects => {
        return prevProjects.map(project => {
          if (project.id === originalProjectId) {
            return {
              ...project,
              tasks: project.tasks.filter(task => task.id !== taskId)
            };
          }
          
          if (project.id === updates.projectId) {
            const updatedTask = tasks.find(t => t.id === taskId);
            if (updatedTask) {
              const newTask = { ...updatedTask, ...updates, projectId: updates.projectId, updatedAt: now };
              return {
                ...project,
                tasks: [...project.tasks, newTask]
              };
            }
          }
          
          return project;
        });
      });
    } else if (updates.status || updates.title || updates.description || updates.priority || updates.deadline || updates.assignedToId) {
      if (originalProjectId) {
        setProjects(prevProjects => {
          return prevProjects.map(project => {
            if (project.id === originalProjectId) {
              return {
                ...project,
                tasks: project.tasks.map(task => {
                  if (task.id === taskId) {
                    return { ...task, ...updates, updatedAt: now };
                  }
                  return task;
                })
              };
            }
            return project;
          });
        });
      }
    }

    toast.success('Task updated successfully!');
  } catch (error) {
    console.error('Error in updateTask:', error);
    playErrorSound();
    toast.error('Failed to update task');
  }
};
