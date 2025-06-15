import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import { Task, TaskStatus, Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProjects } from '@/hooks/useProjects';

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  
  // Project operations
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;
  fetchProjects: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  createProject: (title: string, description?: string, startDate?: string, endDate?: string, budget?: number) => Promise<Project | undefined>;
  deleteProject: (projectId: string) => Promise<void>;
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) {
      console.error('User ID is missing');
      return;
    }

    const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      ...taskData,
      userId: user.id,
    };

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            ...newTask,
            user_id: newTask.userId,
            project_id: newTask.projectId,
            title: newTask.title,
            description: newTask.description,
            deadline: newTask.deadline,
            priority: newTask.priority,
            status: newTask.status,
            cost: newTask.cost
          },
        ])
        .select();

      if (error) {
        console.error('Error adding task:', error);
        toast.error('Failed to add task');
        setError(error.message);
      } else {
        console.log('Task added successfully:', data);
        
        // Optimistically update the local state
        setTasks((prevTasks) => [
          ...prevTasks,
          {
            id: data[0].id,
            userId: data[0].user_id,
            projectId: data[0].project_id,
            title: data[0].title,
            description: data[0].description,
            deadline: new Date(data[0].deadline),
            priority: data[0].priority as Task['priority'],
            status: data[0].status as Task['status'],
            createdAt: new Date(data[0].created_at),
            updatedAt: new Date(data[0].updated_at),
            cost: data[0].cost,
            organizationId: data[0].organization_id
          },
        ]);
        toast.success('Task added successfully');
      }
    } catch (err: any) {
      console.error('Error adding task:', err);
      toast.error('Failed to add task');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (task: Task) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          priority: task.priority,
          status: task.status,
          cost: task.cost
        })
        .eq('id', task.id)
        .select();

      if (error) {
        console.error('Error updating task:', error);
        toast.error('Failed to update task');
        setError(error.message);
      } else {
        console.log('Task updated successfully:', data);
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === task.id ? { ...task } : t))
        );
        toast.success('Task updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating task:', err);
      toast.error('Failed to update task');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('tasks').delete().eq('id', id);

      if (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task');
        setError(error.message);
      } else {
        console.log('Task deleted successfully');
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
        toast.success('Task deleted successfully');
      }
    } catch (err: any) {
      console.error('Error deleting task:', err);
      toast.error('Failed to delete task');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id)
        .select();
  
      if (error) {
        console.error('Error updating task status:', error);
        toast.error('Failed to update task status');
        setError(error.message);
      } else {
        console.log('Task status updated successfully:', data);
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === id ? { ...task, status: status } : task
          )
        );
        toast.success('Task status updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating task status:', err);
      toast.error('Failed to update task status');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get projects hook data
  const { 
    projects, 
    loading: projectsLoading, 
    error: projectsError, 
    fetchProjects,
    refreshProjects, // Add this line
    createProject,
    deleteProject,
    setProjects
  } = useProjects();

  const value: TaskContextType = {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    projects,
    projectsLoading,
    projectsError,
    fetchProjects,
    refreshProjects, // Add this line
    createProject,
    deleteProject,
    setProjects,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTask = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }

  return context;
};
