export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  deadline: Date;
  assignedTo?: string;
  assignedToIds?: string[];
  assignedToNames?: string[];
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
  cost?: number;
  organizationId: string;
  userId: string;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  content: string;
  userId: string;
  userName?: string;
  taskId?: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  category?: string;
  isPinned?: boolean;
  metadata?: Record<string, any>;
  text: string;
  organizationId: string;
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
