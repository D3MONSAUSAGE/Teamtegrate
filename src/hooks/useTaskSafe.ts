import { useTask, TaskContextType } from '@/contexts/task';

/**
 * Safe version of useTask that returns undefined instead of throwing
 * when TaskProvider is not available
 */
export const useTaskSafe = (): TaskContextType | undefined => {
  try {
    return useTask();
  } catch (error) {
    console.warn('TaskProvider not available, returning undefined');
    return undefined;
  }
};