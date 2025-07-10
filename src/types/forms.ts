
import { TaskPriority } from './index';

export interface TaskFormValues {
  title: string;
  description?: string;
  priority: TaskPriority;
  deadline: Date | string;
  projectId?: string;
  cost?: number | string; // Allow both number and string for form handling
  assignedToId?: string;
  assignedToName?: string;
  assignedToIds?: string[];
  assignedToNames?: string[];
}

export interface ProjectFormValues {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  teamMemberIds?: string[];
  tags?: string[];
}

export interface UserFormValues {
  name: string;
  email: string;
  role: 'user' | 'manager' | 'admin';
  timezone?: string;
}

export interface CommentFormValues {
  text: string;
  category?: string;
  isPinned?: boolean;
}
