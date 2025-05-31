
import { User } from '@/types';

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'To Do' | 'In Progress' | 'Pending' | 'Completed';

export interface Task {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  description: string;
  deadline: Date;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  assignedToId?: string;
  assignedToName?: string;
  comments?: TaskComment[];
  cost?: number;
  completedById?: string;
  completedByName?: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
}

export type DailyScore = {
  completedTasks: number;
  totalTasks: number;
  percentage: number;
  date: Date;
};

export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  deadline: string | Date;
  projectId?: string;
  cost?: number | string;
  assignedToId?: string; 
  assignedToName?: string;
}
