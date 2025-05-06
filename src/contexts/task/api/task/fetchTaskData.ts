
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
    
    // Log project IDs to help debug task assignments
    const projectIds = [...new Set(taskData.map(task => task.project_id))].filter(Boolean);
    console.log(`Tasks belong to ${projectIds.length} projects:`, projectIds);
    
    // Log some sample tasks to debug
    if (taskData.length > 0) {
      console.log('Sample task:', taskData[0]);
    }
    
    return taskData;
  } catch (err) {
    console.error('Unexpected error in fetchTaskData:', err);
    return null;
  }
};
