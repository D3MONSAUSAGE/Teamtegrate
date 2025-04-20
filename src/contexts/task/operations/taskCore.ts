import { Task, User, TaskStatus, DailyScore, TaskPriority, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { v4 as uuidv4 } from 'uuid';

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
      project_id: task.projectId || null,
      title: task.title,
      description: task.description,
      deadline: task.deadline.toISOString(),
      priority: task.priority,
      status: task.status,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      assigned_to_id: task.assignedToId || null,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskToInsert)
      .select('*')
      .single();

    if (error) {
      console.error('Error adding task:', error);
      playErrorSound();
      toast.error('Failed to create task');
      return;
    }

    if (data) {
      const newTask: Task = {
        id: data.id,
        userId: data.user_id || user.id,
        projectId: data.project_id || undefined,
        title: data.title || '',
        description: data.description || '',
        deadline: new Date(data.deadline || now),
        priority: (data.priority as TaskPriority) || 'Medium',
        status: (data.status as TaskStatus) || 'To Do',
        createdAt: new Date(data.created_at || now),
        updatedAt: new Date(data.updated_at || now),
        assignedToId: data.assigned_to_id || undefined,
        assignedToName: task.assignedToName,
        tags: [],
        comments: [],
        cost: data.cost || 0,
      };

      setTasks(prevTasks => [...prevTasks, newTask]);
      
      if (newTask.projectId) {
        setProjects(prevProjects => 
          prevProjects.map(project => {
            if (project.id === newTask.projectId) {
              return {
                ...project,
                tasks: [...project.tasks, newTask]
              };
            }
            return project;
          })
        );
      }
      
      playSuccessSound();
      toast.success('Task created successfully!');
    }
  } catch (error) {
    console.error('Error in addTask:', error);
    playErrorSound();
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

export const deleteTask = async (
  taskId: string,
  user: User | null,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const taskToDelete = projects.flatMap(p => p.tasks).find(t => t.id === taskId) || 
                        tasks.find(t => t.id === taskId);
    const projectId = taskToDelete?.projectId;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      playErrorSound();
      toast.error('Failed to delete task');
      return;
    }

    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    
    if (projectId) {
      setProjects(prevProjects => {
        return prevProjects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              tasks: project.tasks.filter(task => task.id !== taskId)
            };
          }
          return project;
        });
      });
    }

    toast.success('Task deleted successfully!');
  } catch (error) {
    console.error('Error in deleteTask:', error);
    playErrorSound();
    toast.error('Failed to delete task');
  }
};
