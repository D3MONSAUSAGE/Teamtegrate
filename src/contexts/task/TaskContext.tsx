
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Task, Project, TaskStatus, TaskPriority, DailyScore, TeamMemberPerformance } from '@/types';
import { useAuth } from '../AuthContext';
import { fetchUserTasks } from './taskApi';
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
  removeTagFromTask 
} from './contentOperations';
import { 
  getTasksWithTag, 
  getProjectsWithTag, 
  getTasksByStatus, 
  getTasksByPriority, 
  getTasksByDate, 
  getOverdueTasks 
} from './taskFilters';
import { fetchTeamPerformance, fetchTeamMemberPerformance } from './api';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  dailyScore: DailyScore;
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'organizationId'>) => Promise<Project | null>;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  assignTaskToProject: (taskId: string, projectId: string) => void;
  assignTaskToUser: (taskId: string, userId: string, userName: string) => void;
  addCommentToTask: (taskId: string, comment: { userId: string; userName: string; text: string }) => void;
  addTagToTask: (taskId: string, tag: string) => void;
  removeTagFromTask: (taskId: string, tag: string) => void;
  addTeamMemberToProject: (projectId: string, userId: string) => void;
  removeTeamMemberFromProject: (projectId: string, userId: string) => void;
  getTasksWithTag: (tag: string) => Task[];
  getProjectsWithTag: (tag: string) => Project[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByPriority: (priority: TaskPriority) => Task[];
  getTasksByDate: (date: Date) => Task[];
  getOverdueTasks: () => Task[];
  fetchTeamPerformance: () => Promise<TeamMemberPerformance[]>;
  fetchTeamMemberPerformance: (userId: string) => Promise<TeamMemberPerformance | null>;
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
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [dailyScore, setDailyScore] = useState<DailyScore>({
    completedTasks: 0,
    totalTasks: 0,
    percentage: 0,
    date: new Date(),
  });

  // Wait for auth to be ready before doing anything
  useEffect(() => {
    if (!authLoading) {
      setAuthReady(true);
    }
  }, [authLoading]);

  const refreshProjects = async () => {
    // Projects are now handled by useProjects hook, so this is a no-op
    // Components should use useProjects directly instead
    console.log('refreshProjects called - projects are now managed by useProjects hook');
  };

  // Load data only when auth is fully ready
  useEffect(() => {
    if (!authReady) {
      console.log('TaskProvider: Waiting for auth to be ready...');
      return;
    }

    const loadData = async () => {
      if (!user || !isAuthenticated) {
        console.log('TaskProvider: No authenticated user, clearing data');
        setProjects([]);
        setTasks([]);
        setIsLoading(false);
        return;
      }

      console.log('TaskProvider: Loading tasks for authenticated user:', user.id, 'org:', user.organization_id);
      setIsLoading(true);
      
      try {
        // Only load tasks - projects are handled by useProjects hook
        // Pass user with organization_id for proper filtering
        const userWithOrg = { ...user, organization_id: user.organization_id };
        await fetchUserTasks(userWithOrg, setTasks).catch(error => {
          console.error("Error loading tasks:", error);
          toast.error("Failed to load tasks");
        });
      } catch (error) {
        console.error("TaskProvider: Critical error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, isAuthenticated, authReady]);

  // Calculate daily score when tasks change
  useEffect(() => {
    if (authReady && user && isAuthenticated) {
      const score = calculateDailyScore(tasks);
      setDailyScore(score);
    }
  }, [tasks, user, isAuthenticated, authReady]);

  const value = {
    tasks,
    projects, // Keep for backward compatibility, but components should use useProjects
    dailyScore,
    isLoading,
    refreshProjects,
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>) => {
      const taskWithOrg = { ...task, organizationId: user?.organization_id };
      return addTask(taskWithOrg, user, tasks, setTasks, projects, setProjects);
    },
    updateTask: (taskId: string, updates: Partial<Task>) => 
      updateTask(taskId, updates, user, tasks, setTasks, projects, setProjects),
    updateTaskStatus: (taskId: string, status: TaskStatus) => 
      updateTaskStatus(taskId, status, user, tasks, setTasks, projects, setProjects, setDailyScore),
    deleteTask: (taskId: string) => 
      deleteTask(taskId, user, setTasks, projects, setProjects),
    addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'organizationId'>) => {
      const projectWithOrg = { ...project, organizationId: user?.organization_id };
      return addProject(projectWithOrg, user, setProjects);
    },
    updateProject: (projectId: string, updates: Partial<Project>) => 
      updateProject(projectId, updates, user, setProjects),
    deleteProject: (projectId: string) => 
      deleteProject(projectId, user, tasks, setTasks, setProjects),
    assignTaskToProject: (taskId: string, projectId: string) => 
      assignTaskToProject(taskId, projectId, user, tasks, setTasks, projects, setProjects),
    assignTaskToUser: (taskId: string, userId: string, userName: string) => 
      assignTaskToUser(taskId, userId, userName, user, tasks, setTasks, projects, setProjects),
    addCommentToTask: (taskId: string, comment: { userId: string; userName: string; text: string }) => {
      const commentWithOrg = { ...comment, organizationId: user?.organization_id };
      return addCommentToTask(taskId, commentWithOrg, tasks, setTasks, projects, setProjects);
    },
    addTagToTask: (taskId: string, tag: string) =>
      addTagToTask(taskId, tag, tasks, setTasks, projects, setProjects),
    removeTagFromTask: (taskId: string, tag: string) =>
      removeTagFromTask(taskId, tag, tasks, setTasks, projects, setProjects),
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
    fetchTeamPerformance,
    fetchTeamMemberPerformance
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
