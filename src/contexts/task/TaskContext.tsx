
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
  updateTask: (taskId: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  assignTaskToUser: (taskId: string, userId: string, userName: string) => Promise<void>;
  addCommentToTask: (taskId: string, comment: string) => Promise<void>;
  dailyScore: number;
  
  // Project operations
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;
  fetchProjects: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  createProject: (title: string, description?: string, startDate?: string, endDate?: string, budget?: number) => Promise<Project | undefined>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
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
  const [dailyScore] = useState(85); // Mock daily score for now
  const { user } = useAuth();

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) {
      console.error('User ID is missing');
      return;
    }

    try {
      setLoading(true);
      
      // Transform the task data for Supabase insertion
      const supabaseTask = {
        id: uuidv4(),
        user_id: user.id,
        project_id: taskData.projectId,
        title: taskData.title,
        description: taskData.description,
        deadline: taskData.deadline.toISOString(),
        priority: taskData.priority,
        status: taskData.status,
        cost: taskData.cost,
        organization_id: user.organizationId,
        assigned_to_id: taskData.assignedToId,
        assigned_to_ids: taskData.assignedToIds || [],
        assigned_to_names: taskData.assignedToNames || []
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([supabaseTask])
        .select();

      if (error) {
        console.error('Error adding task:', error);
        toast.error('Failed to add task');
        setError(error.message);
      } else {
        console.log('Task added successfully:', data);
        
        // Transform back to frontend format and update local state
        if (data && data.length > 0) {
          const dbTask = data[0];
          const transformedTask: Task = {
            id: dbTask.id,
            userId: dbTask.user_id,
            projectId: dbTask.project_id,
            title: dbTask.title,
            description: dbTask.description,
            deadline: new Date(dbTask.deadline),
            priority: dbTask.priority as Task['priority'],
            status: dbTask.status as Task['status'],
            createdAt: new Date(dbTask.created_at),
            updatedAt: new Date(dbTask.updated_at),
            cost: dbTask.cost,
            organizationId: dbTask.organization_id,
            assignedToId: dbTask.assigned_to_id,
            assignedToIds: dbTask.assigned_to_ids,
            assignedToNames: dbTask.assigned_to_names
          };
          
          setTasks((prevTasks) => [...prevTasks, transformedTask]);
        }
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

  const updateTask = async (taskId: string, taskUpdates: Partial<Task>) => {
    try {
      setLoading(true);
      
      // Transform updates for database
      const dbUpdates: any = {};
      if (taskUpdates.title) dbUpdates.title = taskUpdates.title;
      if (taskUpdates.description) dbUpdates.description = taskUpdates.description;
      if (taskUpdates.deadline) dbUpdates.deadline = taskUpdates.deadline.toISOString();
      if (taskUpdates.priority) dbUpdates.priority = taskUpdates.priority;
      if (taskUpdates.status) dbUpdates.status = taskUpdates.status;
      if (taskUpdates.cost !== undefined) dbUpdates.cost = taskUpdates.cost;
      
      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId)
        .select();

      if (error) {
        console.error('Error updating task:', error);
        toast.error('Failed to update task');
        setError(error.message);
      } else {
        console.log('Task updated successfully:', data);
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === taskId ? { ...t, ...taskUpdates } : t))
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

  const assignTaskToUser = async (taskId: string, userId: string, userName: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('tasks')
        .update({ 
          assigned_to_id: userId,
          assigned_to_names: [userName]
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error assigning task:', error);
        toast.error('Failed to assign task');
        setError(error.message);
      } else {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, assignedToId: userId, assignedToNames: [userName] } : task
          )
        );
        toast.success('Task assigned successfully');
      }
    } catch (err: any) {
      console.error('Error assigning task:', err);
      toast.error('Failed to assign task');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCommentToTask = async (taskId: string, comment: string) => {
    if (!user?.id || !user?.organizationId) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          task_id: taskId,
          user_id: user.id,
          organization_id: user.organizationId,
          content: comment
        }]);

      if (error) {
        console.error('Error adding comment:', error);
        toast.error('Failed to add comment');
      } else {
        toast.success('Comment added successfully');
      }
    } catch (err: any) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment');
    }
  };

  // Get projects hook data
  const { 
    projects, 
    loading: projectsLoading, 
    error: projectsError, 
    fetchProjects,
    refreshProjects,
    createProject,
    deleteProject,
    setProjects
  } = useProjects();

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      setLoading(true);
      
      // Transform updates for database
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.description) dbUpdates.description = updates.description;
      if (updates.startDate) dbUpdates.start_date = updates.startDate.toISOString();
      if (updates.endDate) dbUpdates.end_date = updates.endDate.toISOString();
      if (updates.budget !== undefined) dbUpdates.budget = updates.budget;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
      if (updates.teamMemberIds) dbUpdates.team_members = updates.teamMemberIds;
      
      const { error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', projectId);

      if (error) {
        console.error('Error updating project:', error);
        toast.error('Failed to update project');
        setError(error.message);
      } else {
        setProjects((prevProjects) =>
          prevProjects.map((p) => (p.id === projectId ? { ...p, ...updates } : p))
        );
        toast.success('Project updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating project:', err);
      toast.error('Failed to update project');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const value: TaskContextType = {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    assignTaskToUser,
    addCommentToTask,
    dailyScore,
    projects,
    projectsLoading,
    projectsError,
    fetchProjects,
    refreshProjects,
    createProject,
    updateProject,
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
