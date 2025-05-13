
import { supabase } from '@/integrations/supabase/client';

export const fetchTaskData = async () => {
  try {
    console.log('Starting task data fetch');
    
    const { data: taskData, error } = await supabase
      .from('tasks')
      .select('*');

    if (error) {
      console.error('Error fetching tasks:', error);
      return null;
    }

    console.log(`Fetched ${taskData.length} tasks from database`);
    
    // Verify task IDs are in the expected format
    const invalidIds = taskData.filter(task => !task.id || typeof task.id !== 'string');
    if (invalidIds.length > 0) {
      console.warn(`Found ${invalidIds.length} tasks with invalid IDs:`, invalidIds);
    }
    
    // Log project IDs to help debug task assignments
    const projectIds = [...new Set(taskData.map(task => task.project_id))].filter(Boolean);
    console.log(`Tasks belong to ${projectIds.length} projects:`, projectIds);
    
    // Log assignment IDs to help debug user assignments
    const assignmentIds = [...new Set(taskData.map(task => task.assigned_to_id))].filter(Boolean);
    console.log(`Tasks assigned to ${assignmentIds.length} users:`, assignmentIds);
    
    // Log some sample tasks to debug
    if (taskData.length > 0) {
      console.log('Sample task:', taskData[0]);
      
      // Check if there are any tasks with numeric IDs that should be strings
      const possibleNumericIds = taskData.filter(task => !isNaN(Number(task.id)));
      if (possibleNumericIds.length > 0) {
        console.warn('Tasks with potentially numeric IDs:', possibleNumericIds.map(t => t.id));
      }
    }
    
    return taskData;
  } catch (err) {
    console.error('Unexpected error in fetchTaskData:', err);
    return null;
  }
};
