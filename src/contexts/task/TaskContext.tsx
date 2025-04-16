
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Task, Project, TaskStatus, TaskPriority, DailyScore } from '@/types';
import { useAuth } from '../AuthContext';
import { fetchTasks, fetchProjects } from './taskApi';
import { calculateDailyScore } from './taskMetrics';
import { 
  addTask, 
  updateTask, 
  updateTaskStatus, 
  deleteTask, 
  assignTaskToProject, 
  assignTaskToUser 
} from './taskOperations';
import { 
  addProject, 
  updateProject, 
  deleteProject, 
  addTeamMemberToProject, 
  removeTeamMemberFromProject 
} from './projectOperations';
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

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  dailyScore: DailyScore;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  assignTaskToProject: (taskId: string, projectId: string) => void;
  assignTaskToUser: (taskId: string, userId: string, userName: string) => void;
  addCommentToTask: (taskId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
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
  const [dailyScore, setDailyScore] = useState<DailyScore>({
    completedTasks: 0,
    totalTasks: 0,
    percentage: 0,
    date: new Date(),
  });

  useEffect(() => {
    if (user) {
      fetchTasks(user, setTasks);
      fetchProjects(user, setProjects);
    } else {
      setTasks([]);
      setProjects([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const score = calculateDailyScore(tasks);
      setDailyScore(score);
    }
  }, [tasks, user]);

  // Create context value object with all the functions
  const value = {
    tasks,
    projects,
    dailyScore,
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
    addCommentToTask: (taskId: string, comment: Omit<Comment, 'id' | 'createdAt'>) =>
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
