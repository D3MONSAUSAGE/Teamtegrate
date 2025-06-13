
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Project, User, TaskStatus, DailyScore } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserTasks } from './taskApi';
import { addTask } from './api/taskCreate';
import { updateTask } from './api/taskUpdate';
import { updateTaskStatus } from './api/taskStatus';
import { deleteTask } from './api/taskDelete';
import { assignTaskToUser } from './operations/assignment/assignTaskToUser';
import { assignTaskToProject } from './operations/assignment/assignTaskToProject';
import { useProjects } from '@/hooks/useProjects';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  dailyScore: DailyScore;
  isLoading: boolean;
  refreshTasks: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => Promise<void>;
  assignTaskToUser: (taskId: string, userId: string, userName: string) => Promise<void>;
  assignTaskToProject: (taskId: string, projectId: string) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { projects: contextProjects, refetch: refetchProjects } = useProjects();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyScore, setDailyScore] = useState<DailyScore>({
    completedTasks: 0,
    totalTasks: 0,
    percentage: 0,
    date: new Date(),
  });

  // Sync projects from useProjects hook
  useEffect(() => {
    if (contextProjects) {
      setProjects(contextProjects);
    }
  }, [contextProjects]);

  // Calculate daily score whenever tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      const today = new Date().toDateString();
      const todaysTasks = tasks.filter(task => 
        new Date(task.createdAt).toDateString() === today
      );
      const completedToday = todaysTasks.filter(task => task.status === 'Completed').length;
      const totalToday = todaysTasks.length;
      
      setDailyScore({
        completedTasks: completedToday,
        totalTasks: totalToday,
        percentage: totalToday > 0 ? (completedToday / totalToday) * 100 : 0,
        date: new Date(),
      });
    }
  }, [tasks]);

  // Fetch tasks when user changes
  useEffect(() => {
    if (user) {
      console.log('TaskProvider: User available, fetching tasks...', { userId: user.id, orgId: user.organizationId });
      loadTasks();
    } else {
      console.log('TaskProvider: No user available, clearing tasks');
      setTasks([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) {
      console.log('TaskProvider: No user for loadTasks');
      return;
    }

    try {
      setIsLoading(true);
      console.log('TaskProvider: Starting to fetch tasks...');
      await fetchUserTasks(user, setTasks);
      console.log('TaskProvider: Successfully fetched tasks');
    } catch (error) {
      console.error('TaskProvider: Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTasks = async () => {
    console.log('TaskProvider: Refreshing tasks...');
    await loadTasks();
  };

  const refreshProjects = async () => {
    console.log('TaskProvider: Refreshing projects...');
    try {
      await refetchProjects();
    } catch (error) {
      console.error('TaskProvider: Error refreshing projects:', error);
    }
  };

  // Wrapper functions that pass the required parameters
  const handleAddTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    await addTask(task, user, tasks, setTasks, projects, setProjects);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;
    await updateTask(taskId, updates, user, tasks, setTasks, projects, setProjects);
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    if (!user) return;
    updateTaskStatus(taskId, status, user, tasks, setTasks, projects, setProjects, setDailyScore);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    await deleteTask(taskId, user, tasks, setTasks, projects, setProjects);
  };

  const handleAssignTaskToUser = async (taskId: string, userId: string, userName: string) => {
    if (!user) return;
    await assignTaskToUser(taskId, userId, userName, user, tasks, setTasks, projects, setProjects);
  };

  const handleAssignTaskToProject = async (taskId: string, projectId: string) => {
    if (!user) return;
    await assignTaskToProject(taskId, projectId, user, tasks, setTasks, projects, setProjects);
  };

  // Project operations - using the useProjects hook for actual operations
  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    console.log('TaskProvider: Update project not implemented in context - use useProjectOperations hook');
  };

  const handleDeleteProject = async (projectId: string) => {
    console.log('TaskProvider: Delete project not implemented in context - use useProjectOperations hook');
  };

  const value: TaskContextType = {
    tasks,
    projects,
    dailyScore,
    isLoading,
    refreshTasks,
    refreshProjects,
    addTask: handleAddTask,
    updateTask: handleUpdateTask,
    updateTaskStatus: handleUpdateTaskStatus,
    deleteTask: handleDeleteTask,
    assignTaskToUser: handleAssignTaskToUser,
    assignTaskToProject: handleAssignTaskToProject,
    updateProject: handleUpdateProject,
    deleteProject: handleDeleteProject,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
