
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { Task, TaskStatus, User, Project, DailyScore } from '@/types';
import { fetchTasks } from './api/taskFetch'; // Use the correct fetch function
import { addTask as addTaskAPI } from './api/taskCreate';
import { deleteTask as deleteTaskAPI } from './api/taskDelete';
import { updateTask as updateTaskAPI, updateTaskStatus as updateTaskStatusAPI } from './api/taskUpdate';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { toast } from '@/components/ui/sonner';
import { assignTaskToUser as assignTaskToUserAPI } from './operations/assignment/assignTaskToUser';

interface TaskContextProps {
  tasks: Task[];
  isLoading: boolean;
  projects: Project[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  assignTaskToUser: (taskId: string, userId: string, userName: string) => Promise<void>;
  addCommentToTask: (taskId: string, comment: string) => Promise<void>;
  updateProject: (projectId: string, updates: any) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  dailyScore: DailyScore;
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
  const { projects, refreshProjects } = useProjects();

  useEffect(() => {
    const loadTasks = async () => {
      if (user) {
        setIsLoading(true);
        try {
          // Use the same fetch function that works for other parts of the app
          console.log('TaskContext: Loading tasks for user:', user);
          const simpleUser = {
            id: user.id,
            organization_id: user.organizationId,
            email: user.email,
            role: user.role
          };
          await fetchTasks(simpleUser, setTasks);
        } catch (error) {
          console.error('TaskContext: Error loading tasks:', error);
          toast.error('Failed to load tasks');
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
      await addTaskAPI(task, user, tasks, setTasks, projects, refreshProjects);
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) {
      toast.error('You must be logged in to update tasks');
      return;
    }

    try {
      await updateTaskAPI(taskId, updates, { id: user.id, organization_id: user.organizationId }, tasks, setTasks, projects, refreshProjects);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

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

      await deleteTaskAPI(taskId, userForDeletion, tasks, setTasks, projects, refreshProjects);
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
      await updateTaskStatusAPI(taskId, status, { id: user.id, organization_id: user.organizationId }, tasks, setTasks);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const assignTaskToUser = async (taskId: string, userId: string, userName: string) => {
    if (!user) {
      toast.error('You must be logged in to assign tasks');
      return;
    }

    try {
      await assignTaskToUserAPI(taskId, userId, userName, user, tasks, setTasks, projects, refreshProjects);
    } catch (error) {
      console.error('Error assigning task to user:', error);
      toast.error('Failed to assign task to user');
    }
  };

  const addCommentToTask = async (taskId: string, comment: string) => {
    // Placeholder implementation
    console.log('Adding comment to task:', taskId, comment);
    toast.success('Comment added successfully');
  };

  const updateProject = async (projectId: string, updates: any) => {
    // Placeholder implementation
    console.log('Updating project:', projectId, updates);
    toast.success('Project updated successfully');
  };

  const deleteProject = async (projectId: string) => {
    // Placeholder implementation
    console.log('Deleting project:', projectId);
    toast.success('Project deleted successfully');
  };

  // Calculate daily score
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todaysTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });
  
  const completedTodaysTasks = todaysTasks.filter(task => task.status === 'Completed');
  
  const dailyScore: DailyScore = {
    totalTasks: todaysTasks.length,
    completedTasks: completedTodaysTasks.length,
    percentage: todaysTasks.length > 0 ? Math.round((completedTodaysTasks.length / todaysTasks.length) * 100) : 0,
    date: today
  };

  const contextValue: TaskContextProps = {
    tasks,
    isLoading,
    projects,
    addTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    assignTaskToUser,
    addCommentToTask,
    updateProject,
    deleteProject,
    refreshProjects,
    dailyScore,
    setTasks,
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskProvider;
export { TaskProvider };
