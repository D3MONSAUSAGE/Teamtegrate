
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

/**
 * Checks if a task is in its warning period (approaching deadline)
 */
export const isTaskInWarningPeriod = (task: Task): boolean => {
  if (!task.deadline || task.status === 'Completed') return false;
  
  const now = new Date();
  const deadline = new Date(task.deadline);
  const warningPeriodHours = (task as any).warning_period_hours || 24; // Default to 24 hours
  
  // Calculate warning period start time
  const warningStart = new Date(deadline.getTime() - (warningPeriodHours * 60 * 60 * 1000));
  
  // Task is in warning period if:
  // 1. Current time is after warning start time
  // 2. Current time is before deadline
  // 3. Task is not completed
  return now >= warningStart && now < deadline;
};

/**
 * Checks if a task is approaching its deadline (alias for isTaskInWarningPeriod)
 */
export const isTaskApproachingDeadline = (task: Task): boolean => {
  return isTaskInWarningPeriod(task);
};
