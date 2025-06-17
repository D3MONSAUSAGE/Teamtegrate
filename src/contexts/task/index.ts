
import { Task, Project, DailyScore, TaskComment } from '@/types';

export interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task | undefined>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task | undefined>;
  updateTask: (taskId: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  assignTaskToUser: (taskId: string, userId: string, userName: string) => Promise<void>;
  addCommentToTask: (taskId: string, commentText: string) => Promise<void>;
  addCommentToProject: (projectId: string, commentText: string) => Promise<void>;
  dailyScore: DailyScore;
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;
  fetchProjects: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  createProject: (title: string, description?: string, startDate?: string, endDate?: string, budget?: number) => Promise<Project | undefined>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

export { TaskProvider, useTask } from './TaskContext';
