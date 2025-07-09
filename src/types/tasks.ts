
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  deadline?: string;
  assignedTo?: string;
  assignedToIds?: string[];
  assignedToNames?: string[];
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  cost?: number;
}

export interface TaskComment {
  id: string;
  content: string;
  userId: string;
  userName?: string;
  taskId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  isPinned?: boolean;
  metadata?: Record<string, any>;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface TaskFormValues {
  title: string;
  description?: string;
  priority: TaskPriority;
  deadline: Date | string;
  projectId?: string;
  cost?: number;
  assignedToId?: string;
  assignedToName?: string;
  assignedToIds?: string[];
  assignedToNames?: string[];
}
