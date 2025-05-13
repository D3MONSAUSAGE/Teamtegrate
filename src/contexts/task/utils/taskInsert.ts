
import { Task, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

/**
 * Validates and formats a deadline for database storage
 */
const formatDeadlineForDB = (deadline: Date | string | undefined): string => {
  // If deadline is not provided, use current time
  if (!deadline) {
    return new Date().toISOString();
  }
  
  try {
    // Convert string to Date if necessary
    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
    
    // Validate the date is not invalid
    if (isNaN(deadlineDate.getTime())) {
      console.warn(`Invalid deadline: "${deadline}", using current date`);
      return new Date().toISOString();
    }
    
    return deadlineDate.toISOString();
  } catch (error) {
    console.warn(`Error formatting deadline: "${deadline}"`, error);
    return new Date().toISOString();
  }
};

/**
 * Creates a task record in the database
 */
export const insertTaskRecord = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<{ data: any; error: any; table: string }> => {
  const now = new Date();
  const taskId = uuidv4();
  
  // Format the deadline properly for database storage
  const formattedDeadline = formatDeadlineForDB(task.deadline);
  
  console.log('Creating new task with deadline:', formattedDeadline);
  console.log('Task creator user ID:', userId);

  const taskToInsert = {
    id: taskId,
    user_id: userId,
    project_id: task.projectId || null,
    title: task.title,
    description: task.description,
    deadline: formattedDeadline,
    priority: task.priority,
    status: task.status,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    assigned_to_id: task.assignedToId || null,
    cost: task.cost || 0
  };

  console.log('Inserting task with data:', JSON.stringify(taskToInsert));

  // First try the main tasks table
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskToInsert)
    .select('*')
    .single();

  if (!error) {
    return { data, error: null, table: 'tasks' };
  }

  console.error('Error adding task to tasks table:', error);
  console.log('Attempting to insert into project_tasks table as fallback...');
    
  // Try project_tasks table as fallback
  const { data: projectTasksData, error: projectTasksError } = await supabase
    .from('project_tasks')
    .insert(taskToInsert)
    .select('*')
    .single();
    
  return { 
    data: projectTasksData, 
    error: projectTasksError, 
    table: 'project_tasks' 
  };
};
