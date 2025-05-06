
import { Task } from '@/types';
import { format } from 'date-fns';

/**
 * Normalizes a task from database format to application format
 */
export const normalizeTaskData = (
  taskData: any, 
  userId: string,
  assignedToName?: string,
  now = new Date()
): Task => {
  console.log('Normalizing task data:', JSON.stringify(taskData));
  
  // Parse date with fallback to current date
  const parseDate = (dateStr: string | null | undefined): Date => {
    if (!dateStr) return new Date();
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string: "${dateStr}", using current date instead`);
        return new Date();
      }
      return date;
    } catch (e) {
      console.warn(`Error parsing date: "${dateStr}", using current date instead:`, e);
      return new Date();
    }
  };

  // Ensure we have a valid deadline
  const deadline = parseDate(taskData.deadline);
  console.log('Parsed deadline:', format(deadline, 'yyyy-MM-dd HH:mm:ss'));

  return {
    id: taskData.id,
    userId: userId,
    projectId: taskData.project_id || undefined,
    title: taskData.title || '',
    description: taskData.description || '',
    deadline: deadline,
    priority: (taskData.priority as Task['priority']) || 'Medium',
    status: (taskData.status as Task['status']) || 'To Do',
    createdAt: parseDate(taskData.created_at),
    updatedAt: parseDate(taskData.updated_at),
    completedAt: taskData.completed_at ? parseDate(taskData.completed_at) : undefined,
    assignedToId: taskData.assigned_to_id || undefined,
    assignedToName: assignedToName,
    tags: taskData.tags || [],
    comments: taskData.comments || [],
    cost: taskData.cost || 0
  };
};
