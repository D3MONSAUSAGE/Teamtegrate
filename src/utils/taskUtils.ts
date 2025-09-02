
import { Task } from '@/types';

/**
 * Checks if a task is overdue (deadline is in the past)
 */
export const isTaskOverdue = (task: Task | null): boolean => {
  if (!task || !task.deadline) return false;
  
  const now = new Date();
  const deadline = new Date(task.deadline);
  
  // A task is overdue if:
  // 1. The deadline is in the past (using full timestamp precision)
  // 2. The task is not completed
  return deadline < now && task.status !== 'Completed';
};

/**
 * Checks if a task is in its warning period (approaching deadline)
 */
export const isTaskInWarningPeriod = (task: Task | null): boolean => {
  if (!task || !task.deadline || task.status === 'Completed') return false;
  
  const now = new Date();
  const deadline = new Date(task.deadline);
  const warningPeriodHours = task.warning_period_hours || 24; // Default to 24 hours
  
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
export const isTaskApproachingDeadline = (task: Task | null): boolean => {
  return isTaskInWarningPeriod(task);
};
