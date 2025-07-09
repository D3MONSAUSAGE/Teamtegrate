
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
  taskId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  isPinned?: boolean;
  metadata?: Record<string, any>;
}
