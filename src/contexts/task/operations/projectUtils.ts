
import { Task, TaskStatus, TaskPriority } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface NewTaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  deadline: Date;
  status: TaskStatus;
}

export const formatNewProjectTasks = (
  tasks: NewTaskInput[],
  userId: string,
  projectId: string,
  timestamp: Date
): Task[] => {
  return tasks.map(task => ({
    id: uuidv4(),
    userId,
    projectId,
    title: task.title,
    description: task.description || '',
    deadline: task.deadline,
    priority: task.priority,
    status: task.status,
    createdAt: timestamp,
    updatedAt: timestamp,
    assignedToId: undefined,
    assignedToName: undefined,
    completedAt: undefined,
    tags: [],
    comments: [],
    cost: 0
  }));
};
