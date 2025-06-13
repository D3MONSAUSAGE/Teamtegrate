import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { Task, TaskStatus, User } from '@/types';
import { fetchUserTasks } from './taskApi';
import { addTask as addTaskAPI } from './api/taskCreate';
import { deleteTask as deleteTaskAPI } from './api/taskDelete';
import { updateTaskStatus as updateTaskStatusAPI } from './api/taskUpdate';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { toast } from '@/components/ui/sonner';

interface TaskContextProps {
  tasks: Task[];
  isLoading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const TaskContext = createContext<TaskContextProps | undefined>(undefined);

export const useTask = (): TaskContextProps => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { projects, setProjects } = useProjects();

  useEffect(() => {
    const loadTasks = async () => {
      if (user) {
        setIsLoading(true);
        try {
          await fetchUserTasks(user, setTasks);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadTasks();
  }, [user]);

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error('You must be logged in to add tasks');
      return;
    }

    try {
      await addTaskAPI(task, user, tasks, setTasks, projects, setProjects);
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  // Updated deleteTask function to handle user object properly
  const deleteTask = async (taskId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete tasks');
      return;
    }

    try {
      console.log('TaskContext: Deleting task', taskId, 'for user:', user);
      
      // Ensure user object has the correct property names for deletion
      const userForDeletion = {
        id: user.id,
        organizationId: user.organizationId,
        organization_id: user.organizationId // Provide both for compatibility
      };

      await deleteTaskAPI(taskId, userForDeletion, tasks, setTasks, projects, setProjects);
    } catch (error) {
      console.error('Error in TaskContext deleteTask:', error);
      toast.error('Failed to delete task');
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!user) {
      toast.error('You must be logged in to update tasks');
      return;
    }

    try {
      await updateTaskStatusAPI(taskId, status, user, tasks, setTasks);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const contextValue: TaskContextProps = {
    tasks,
    isLoading,
    addTask,
    updateTaskStatus,
    deleteTask,
    setTasks,
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskProvider;
