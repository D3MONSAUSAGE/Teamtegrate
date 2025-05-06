
import { Task, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

/**
 * Creates a task record in the database
 */
export const insertTaskRecord = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<{ data: any; error: any; table: string }> => {
  const now = new Date();
  const taskId = uuidv4();

  // Make sure deadline is a valid date object
  const deadline = task.deadline instanceof Date ? task.deadline : new Date(task.deadline);
  
  console.log('Creating new task with deadline:', format(deadline, 'yyyy-MM-dd HH:mm:ss'));
  console.log('Task creator user ID:', userId);

  const taskToInsert = {
    id: taskId,
    user_id: userId,
    project_id: task.projectId || null,
    title: task.title,
    description: task.description,
    deadline: deadline.toISOString(),
    priority: task.priority,
    status: task.status,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    assigned_to_id: task.assignedToId || null,
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
