
import { Task } from '@/types';
import { format } from 'date-fns';

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

  // Handle assigned user data - ensure proper data types and consistency
  let assignedToId = dbTask.assigned_to_id;
  let assignedToName = assignedName || dbTask.assigned_to_name;
  
  // Log the assigned data for debugging
  console.log(`Task ${dbTask.id} assignment data:`, {
    rawAssignedToId: dbTask.assigned_to_id,
    rawAssignedToName: dbTask.assigned_to_name,
    providedName: assignedName,
    finalAssignedToId: assignedToId,
    finalAssignedToName: assignedToName
  });
  
  // Ensure we're consistent about nullish values
  if (!assignedToId) {
    assignedToId = undefined;
    // If no ID, we should consider this unassigned regardless of name
    assignedToName = undefined;
  }
  
  // Create a normalized task object
  const deadline = parseDate(dbTask.deadline);
  
  const normalizedTask: Task = {
    id: String(dbTask.id),
    userId: userId,
    projectId: dbTask.project_id || undefined,
    title: dbTask.title || '',
    description: dbTask.description || '',
    deadline: deadline,
    priority: (dbTask.priority || 'Medium') as Task['priority'],
    status: (dbTask.status || 'To Do') as Task['status'],
    createdAt: parseDate(dbTask.created_at),
    updatedAt: parseDate(dbTask.updated_at),
    completedAt: dbTask.completed_at ? parseDate(dbTask.completed_at) : undefined,
    assignedToId: assignedToId,
    assignedToName: assignedToName,
    comments: [],
    cost: dbTask.cost || 0,
    tags: dbTask.tags || []
  };

  return normalizedTask;
};
