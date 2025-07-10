
import { TaskPriority, TaskStatus, TaskComment } from './index';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
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

export { TaskComment, TaskStatus, TaskPriority };

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
