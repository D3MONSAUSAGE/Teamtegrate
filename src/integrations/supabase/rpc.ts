
import { supabase } from './client';

// Function to create RPC functions in Supabase
export const createRpcFunctions = async () => {
  try {
    // Create function to get all tasks - use executeRpc helper instead of direct call
    console.log('Setting up get_all_tasks function...');
    await executeRpc('create_get_all_tasks_function');
    
    // Create function to get all projects
    console.log('Setting up get_all_projects function...');
    await executeRpc('create_get_all_projects_function');
  } catch (error) {
    console.error('Error setting up RPC functions:', error);
  }
};

// Helper function to execute RPC calls with proper error handling
export const executeRpc = async (functionName: string, params?: any) => {
  try {
    // Explicitly type the functionName as any to bypass TypeScript's strict checking
    // since we're dynamically adding functions to Supabase
    const { data, error } = await supabase.rpc(functionName as any, params);
    
    if (error) {
      console.error(`Error executing RPC function ${functionName}:`, error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error(`Exception in RPC function ${functionName}:`, err);
    return null;
  }
};
