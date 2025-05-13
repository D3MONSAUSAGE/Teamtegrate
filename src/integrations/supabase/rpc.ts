
import { supabase } from './client';

// Function to create RPC functions in Supabase
export const createRpcFunctions = async () => {
  try {
    console.log('Setting up RPC functions...');
    
    // Create function to get all tasks
    await executeRpc('create_get_all_tasks_function');
    
    // Create function to get all projects
    await executeRpc('create_get_all_projects_function');
    
    // Verify the functions are working
    const tasksTest = await executeRpc('get_all_tasks');
    const projectsTest = await executeRpc('get_all_projects');
    
    const tasksStatus = tasksTest !== null ? 'Success' : 'Failed';
    const projectsStatus = projectsTest !== null ? 'Success' : 'Failed';
    
    console.log(`RPC functions setup complete. Tests: get_all_tasks (${tasksStatus}), get_all_projects (${projectsStatus})`);
    
    return {
      success: tasksTest !== null && projectsTest !== null,
      tasksCount: Array.isArray(tasksTest) ? tasksTest.length : 0,
      projectsCount: Array.isArray(projectsTest) ? projectsTest.length : 0
    };
  } catch (error) {
    console.error('Error setting up RPC functions:', error);
    return { success: false, tasksCount: 0, projectsCount: 0 };
  }
};

// Helper function to execute RPC calls with proper error handling
export const executeRpc = async (functionName: string, params?: any) => {
  try {
    const { data, error } = await supabase.rpc(functionName as any, params);
    
    if (error) {
      console.error(`Error executing RPC function ${functionName}:`, error);
      return null;
    }
    
    // Log detailed info for get_all_tasks function
    if (functionName === 'get_all_tasks' && Array.isArray(data)) {
      console.log(`RPC function ${functionName} returned ${data.length} tasks`);
      if (data.length > 0) {
        console.log('Sample task structure:', Object.keys(data[0]).join(', '));
      }
    }
    
    return data;
  } catch (err) {
    console.error(`Exception in RPC function ${functionName}:`, err);
    return null;
  }
};
