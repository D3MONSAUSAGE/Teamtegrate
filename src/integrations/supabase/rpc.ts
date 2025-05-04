
import { supabase } from './client';

// Function to create RPC functions in Supabase
export const createRpcFunctions = async () => {
  // Create function to get all tasks
  const createGetTasksFunc = await supabase.rpc('create_get_all_tasks_function');
  console.log('Created get_all_tasks function:', createGetTasksFunc);
  
  // Create function to get all projects
  const createGetProjectsFunc = await supabase.rpc('create_get_all_projects_function');
  console.log('Created get_all_projects function:', createGetProjectsFunc);
};
