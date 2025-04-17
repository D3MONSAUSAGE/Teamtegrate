import { User, Task, Project, TaskStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import { calculateDailyScore } from './taskMetrics';

export const addTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;
    
    const now = new Date();
    const taskId = uuidv4();
    
    const taskToInsert = {
      id: taskId,
      user_id: user.id,
      project_id: task.projectId,
      title: task.title,
      description: task.description,
      deadline: task.deadline.toISOString(),
      priority: task.priority,
      status: task.status,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      assigned_to_id: task.assignedToId,
      cost: task.cost
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskToInsert)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to create task');
      return;
    }
    
    if (data) {
      const newTask: Task = {
        id: data.id,
        userId: data.user_id,
        projectId: data.project_id,
        title: data.title,
        description: data.description,
        deadline: new Date(data.deadline),
        priority: data.priority as any,
        status: data.status as any,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        assignedToId: data.assigned_to_id,
        assignedToName: task.assignedToName,
        cost: data.cost
      };
      
      setTasks(prevTasks => [...prevTasks, newTask]);
      
      if (task.projectId) {
        setProjects(prevProjects => prevProjects.map(project => {
          if (project.id === task.projectId) {
            return {
              ...project,
              tasks: [...project.tasks, newTask]
            };
          }
          return project;
        }));
      }
      
      toast.success('Task created successfully!');
    }
  } catch (error) {
    console.error('Error in addTask:', error);
    toast.error('Failed to create task');
  }
};

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
    
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    
    const now = new Date();
    const updatedFields: any = {
      updated_at: now.toISOString()
    };
    
    if (updates.title !== undefined) updatedFields.title = updates.title;
    if (updates.description !== undefined) updatedFields.description = updates.description;
    if (updates.deadline !== undefined) updatedFields.deadline = updates.deadline.toISOString();
    if (updates.priority !== undefined) updatedFields.priority = updates.priority;
    if (updates.status !== undefined) updatedFields.status = updates.status;
    if (updates.projectId !== undefined) updatedFields.project_id = updates.projectId;
    if (updates.assignedToId !== undefined) updatedFields.assigned_to_id = updates.assignedToId;
    if (updates.completedAt !== undefined) updatedFields.completed_at = updates.completedAt ? updates.completedAt.toISOString() : null;
    if (updates.cost !== undefined) updatedFields.cost = updates.cost;
    
    const { error } = await supabase
      .from('tasks')
      .update(updatedFields)
      .eq('id', taskId);
    
    if (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return;
    }
    
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, ...updates, updatedAt: now };
      }
      return task;
    }));
    
    setProjects(prevProjects => prevProjects.map(project => {
      const projectContainsTask = project.tasks.some(t => t.id === taskId);
      
      if (projectContainsTask || updates.projectId === project.id) {
        const updatedTasks = project.tasks.map(task => {
          if (task.id === taskId) {
            return { ...task, ...updates, updatedAt: now };
          }
          return task;
        });
        
        if (updates.projectId === project.id && !projectContainsTask) {
          const taskToAdd = { ...taskToUpdate, ...updates, updatedAt: now };
          return {
            ...project,
            tasks: [...updatedTasks, taskToAdd]
          };
        }
        
        return {
          ...project,
          tasks: updatedTasks
        };
      } else if (project.id === taskToUpdate.projectId && updates.projectId !== undefined) {
        return {
          ...project,
          tasks: project.tasks.filter(t => t.id !== taskId)
        };
      }
      
      return project;
    }));
    
    toast.success('Task updated successfully!');
  } catch (error) {
    console.error('Error in updateTask:', error);
    toast.error('Failed to update task');
  }
};

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setDailyScore: React.Dispatch<React.SetStateAction<any>>
) => {
  try {
    if (!user) return;
    
    const now = new Date();
    const completedAt = status === 'Completed' ? now : null;
    
    const { error } = await supabase
      .from('tasks')
      .update({
        status,
        completed_at: completedAt ? completedAt.toISOString() : null,
        updated_at: now.toISOString()
      })
      .eq('id', taskId);
    
    if (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
      return;
    }
    
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status,
          completedAt: completedAt || undefined,
          updatedAt: now
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    
    setProjects(prevProjects => prevProjects.map(project => {
      return {
        ...project,
        tasks: project.tasks.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              status,
              completedAt: completedAt || undefined,
              updatedAt: now
            };
          }
          return task;
        })
      };
    }));
    
    toast.success(`Task status updated to ${status}!`);
    
    // Recalculate daily score
    const score = calculateDailyScore(updatedTasks);
    setDailyScore(score);
  } catch (error) {
    console.error('Error in updateTaskStatus:', error);
    toast.error('Failed to update task status');
  }
};

export const deleteTask = async (
  taskId: string,
  user: User | null,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      return;
    }
    
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    
    setProjects(prevProjects => prevProjects.map(project => {
      return {
        ...project,
        tasks: project.tasks.filter(task => task.id !== taskId)
      };
    }));
    
    toast.success('Task deleted successfully!');
  } catch (error) {
    console.error('Error in deleteTask:', error);
    toast.error('Failed to delete task');
  }
};

export const assignTaskToProject = async (
  taskId: string,
  projectId: string,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    await updateTask(taskId, { projectId }, user, tasks, setTasks, projects, setProjects);
  } catch (error) {
    console.error('Error in assignTaskToProject:', error);
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
    await updateTask(taskId, { assignedToId: userId, assignedToName: userName }, user, tasks, setTasks, projects, setProjects);
  } catch (error) {
    console.error('Error in assignTaskToUser:', error);
  }
};
