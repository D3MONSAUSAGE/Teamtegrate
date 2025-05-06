
import { Task } from '@/types';
import { format } from 'date-fns';

/**
 * Parses and validates a date string with fallback to a default date
 */
const parseAndValidateDate = (dateStr: string | null | undefined, defaultDate: Date = new Date()): Date => {
  if (!dateStr) return defaultDate;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: "${dateStr}", using default date instead`);
      return defaultDate;
    }
    return date;
  } catch (e) {
    console.warn(`Error parsing date: "${dateStr}", using default date instead:`, e);
    return defaultDate;
  }
};

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
  
  // Ensure we have a valid deadline
  const deadline = parseAndValidateDate(taskData.deadline);
  console.log('Parsed deadline:', format(deadline, 'yyyy-MM-dd HH:mm:ss'));

  // Parse other dates with appropriate fallbacks
  const createdAt = parseAndValidateDate(taskData.created_at, now);
  const updatedAt = parseAndValidateDate(taskData.updated_at, now);
  const completedAt = taskData.completed_at ? parseAndValidateDate(taskData.completed_at) : undefined;

  return {
    id: taskData.id,
    userId: userId,
    projectId: taskData.project_id || undefined,
    title: taskData.title || '',
    description: taskData.description || '',
    deadline: deadline,
    priority: (taskData.priority as Task['priority']) || 'Medium',
    status: (taskData.status as Task['status']) || 'To Do',
    createdAt: createdAt,
    updatedAt: updatedAt,
    completedAt: completedAt,
    assignedToId: taskData.assigned_to_id || undefined,
    assignedToName: assignedToName,
    tags: taskData.tags || [],
    comments: taskData.comments || [],
    cost: taskData.cost || 0
  };
};
