import React, { createContext, useState, useContext, useEffect } from 'react';
import { Task, Project, TaskStatus, TaskPriority, DailyScore } from '@/types';
import { useAuth } from '../AuthContext';
import { fetchTasks } from './api/taskFetch';
import { fetchProjects } from './api/projects';
import { calculateDailyScore } from './taskMetrics';
import { toast } from '@/components/ui/sonner';
import { 
  addTask, 
  updateTask, 
  updateTaskStatus, 
  deleteTask, 
  assignTaskToProject, 
  assignTaskToUser,
  addProject, 
  updateProject, 
  deleteProject,
  addTeamMemberToProject,
  removeTeamMemberFromProject
} from './operations';
import { 
  addCommentToTask, 
  addTagToTask, 
  removeTagFromTask, 
  addTagToProject, 
  removeTagFromProject 
} from './contentOperations';
import { 
  getTasksWithTag, 
  getProjectsWithTag, 
  getTasksByStatus, 
  getTasksByPriority, 
  getTasksByDate, 
  getOverdueTasks 
} from './taskFilters';
import { setupRpcFunctions } from '@/integrations/supabase/client';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  dailyScore: DailyScore;
  refreshProjects: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  isLoading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => Promise<Project | null>;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  assignTaskToProject: (taskId: string, projectId: string) => void;
  assignTaskToUser: (taskId: string, userId: string, userName: string) => void;
  addCommentToTask: (taskId: string, comment: { userId: string; userName: string; text: string }) => void;
  addTagToTask: (taskId: string, tag: string) => void;
  removeTagFromTask: (taskId: string, tag: string) => void;
  addTagToProject: (projectId: string, tag: string) => void;
  removeTagFromProject: (projectId: string, tag: string) => void;
  addTeamMemberToProject: (projectId: string, userId: string) => void;
  removeTeamMemberFromProject: (projectId: string, userId: string) => void;
  getTasksWithTag: (tag: string) => Task[];
  getProjectsWithTag: (tag: string) => Project[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByPriority: (priority: TaskPriority) => Task[];
  getTasksByDate: (date: Date) => Task[];
  getOverdueTasks: () => Task[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maxRetries] = useState(3);
  const [currentRetry, setCurrentRetry] = useState(0);
  const [rpcSetupDone, setRpcSetupDone] = useState(false);
  const [dailyScore, setDailyScore] = useState<DailyScore>({
    completedTasks: 0,
    totalTasks: 0,
    percentage: 0,
    date: new Date(),
  });

  // Set up RPC functions once when the app loads
  useEffect(() => {
    const setupRpc = async () => {
      try {
        console.log('Setting up RPC functions...');
        await setupRpcFunctions();
        setRpcSetupDone(true);
        console.log('RPC functions setup complete');
      } catch (err) {
        console.error('Failed to setup RPC functions:', err);
      }
    };
    
    setupRpc();
  }, []);

  const refreshProjects = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      await fetchProjects(user, setProjects);
    } catch (error) {
      console.error("Error refreshing projects:", error);
      toast.error("Failed to refresh projects");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTasks = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      await fetchTasks(user, setTasks);
    } catch (error) {
      console.error("Error refreshing tasks:", error);
      toast.error("Failed to refresh tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setProjects([]);
        setTasks([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log("Loading data for user:", user.id);
        
        // Try to fetch tasks and projects with exponential backoff
        let tasksSuccess = false;
        let projectsSuccess = false;
        
        // Reset retry counter
        setCurrentRetry(0);
        
        while ((!tasksSuccess || !projectsSuccess) && currentRetry < maxRetries) {
          if (!tasksSuccess) {
            try {
              await fetchTasks(user, setTasks);
              tasksSuccess = true;
              console.log("Tasks loaded successfully on attempt:", currentRetry + 1);
            } catch (error) {
              console.error(`Tasks fetch failed on attempt ${currentRetry + 1}:`, error);
            }
          }
          
          if (!projectsSuccess) {
            try {
              await fetchProjects(user, setProjects);
              projectsSuccess = true;
              console.log("Projects loaded successfully on attempt:", currentRetry + 1);
            } catch (error) {
              console.error(`Projects fetch failed on attempt ${currentRetry + 1}:`, error);
            }
          }
          
          if (!tasksSuccess || !projectsSuccess) {
            setCurrentRetry(prev => prev + 1);
            const backoffTime = Math.min(1000 * Math.pow(2, currentRetry), 5000);
            console.log(`Retrying in ${backoffTime}ms (attempt ${currentRetry + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          }
        }
        
        if (!tasksSuccess || !projectsSuccess) {
          console.warn("Failed to load all data after multiple attempts");
          toast.error("Some data couldn't be loaded. Please try refreshing.");
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, currentRetry, maxRetries]);

  useEffect(() => {
    if (user) {
      const score = calculateDailyScore(tasks);
      setDailyScore(score);
    }
  }, [tasks, user]);

  const value = {
    tasks,
    projects,
    dailyScore,
    isLoading,
    refreshProjects,
    refreshTasks,
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => 
      addTask(task, user, tasks, setTasks, projects, setProjects),
    updateTask: (taskId: string, updates: Partial<Task>) => 
      updateTask(taskId, updates, user, tasks, setTasks, projects, setProjects),
    updateTaskStatus: (taskId: string, status: TaskStatus) => 
      updateTaskStatus(taskId, status, user, tasks, setTasks, projects, setProjects, setDailyScore),
    deleteTask: (taskId: string) => 
      deleteTask(taskId, user, setTasks, projects, setProjects),
    addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => 
      addProject(project, user, setProjects),
    updateProject: (projectId: string, updates: Partial<Project>) => 
      updateProject(projectId, updates, user, setProjects),
    deleteProject: (projectId: string) => 
      deleteProject(projectId, user, tasks, setTasks, setProjects),
    assignTaskToProject: (taskId: string, projectId: string) => 
      assignTaskToProject(taskId, projectId, user, tasks, setTasks, projects, setProjects),
    assignTaskToUser: (taskId: string, userId: string, userName: string) => 
      assignTaskToUser(taskId, userId, userName, user, tasks, setTasks, projects, setProjects),
    addCommentToTask: (taskId: string, comment: { userId: string; userName: string; text: string }) =>
      addCommentToTask(taskId, comment, tasks, setTasks, projects, setProjects),
    addTagToTask: (taskId: string, tag: string) =>
      addTagToTask(taskId, tag, tasks, setTasks, projects, setProjects),
    removeTagFromTask: (taskId: string, tag: string) =>
      removeTagFromTask(taskId, tag, tasks, setTasks, projects, setProjects),
    addTagToProject: (projectId: string, tag: string) =>
      addTagToProject(projectId, tag, projects, setProjects),
    removeTagFromProject: (projectId: string, tag: string) =>
      removeTagFromProject(projectId, tag, projects, setProjects),
    addTeamMemberToProject: (projectId: string, userId: string) =>
      addTeamMemberToProject(projectId, userId, projects, setProjects),
    removeTeamMemberFromProject: (projectId: string, userId: string) =>
      removeTeamMemberFromProject(projectId, userId, projects, setProjects),
    getTasksWithTag: (tag: string) => getTasksWithTag(tag, tasks),
    getProjectsWithTag: (tag: string) => getProjectsWithTag(tag, projects),
    getTasksByStatus: (status: TaskStatus) => getTasksByStatus(status, tasks),
    getTasksByPriority: (priority: TaskPriority) => getTasksByPriority(priority, tasks),
    getTasksByDate: (date: Date) => getTasksByDate(date, tasks),
    getOverdueTasks: () => getOverdueTasks(tasks),
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
