
import { Task } from '@/types';

/**
 * Normalizes task data from database format to application format
 */
export const normalizeTaskData = (
  dbTask: any, 
  userId: string,
  assignedName?: string
): Task => {
  // Parse dates with validation
  const parseDate = (dateStr: string | null | undefined): Date => {
    if (!dateStr) return new Date();
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string: "${dateStr}", using current date`);
        return new Date();
      }
      return date;
    } catch (e) {
      console.warn(`Error parsing date: "${dateStr}"`, e);
      return new Date();
    }
  };

  // Handle assigned user data
  let assignedToId = dbTask.assigned_to_id || undefined;
  if (assignedToId && typeof assignedToId !== 'string') {
    assignedToId = String(assignedToId);
  }

  // Create a normalized task object
  const normalizedTask: Task = {
    id: String(dbTask.id),
    userId: userId,
    projectId: dbTask.project_id || undefined,
    title: dbTask.title || '',
    description: dbTask.description || '',
    deadline: dbTask.deadline ? parseDate(dbTask.deadline) : new Date(),
    priority: (dbTask.priority || 'Medium') as Task['priority'],
    status: (dbTask.status || 'To Do') as Task['status'],
    createdAt: parseDate(dbTask.created_at),
    updatedAt: parseDate(dbTask.updated_at),
    completedAt: dbTask.completed_at ? parseDate(dbTask.completed_at) : undefined,
    assignedToId: assignedToId,
    assignedToName: assignedName || 'Unknown User',
    comments: [],
    cost: dbTask.cost || 0,
    tags: dbTask.tags || []
  };

  // Log the normalized task data for debugging
  console.log('Normalized task data:', {
    id: normalizedTask.id,
    title: normalizedTask.title,
    deadline: normalizedTask.deadline.toISOString(),
    assignedToId: normalizedTask.assignedToId || 'unassigned',
    assignedToName: normalizedTask.assignedToName || 'unassigned'
  });

  return normalizedTask;
};
