
import { Task } from '@/types';

/**
 * Checks if a task is overdue (deadline is in the past)
 */
export const isTaskOverdue = (task: Task): boolean => {
  if (!task.deadline) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  
  const deadline = new Date(task.deadline);
  deadline.setHours(0, 0, 0, 0); // Normalize to start of day
  
  // A task is overdue if:
  // 1. The deadline is in the past
  // 2. The task is not completed
  return deadline < today && task.status !== 'Completed';
};
