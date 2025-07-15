
import { TaskPriority, TaskStatus, TaskComment } from './index';

export type { TaskComment, TaskStatus, TaskPriority };

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
  scheduledStart?: Date | string;
  scheduledEnd?: Date | string;
}
