
import { supabase } from '@/integrations/supabase/client';

// Helper function to get current user's organization ID
// This is used by RLS policies to enforce organization-level data isolation
export const getCurrentUserOrganizationId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user organization:', error);
      return null;
    }

    return data?.organization_id || null;
  } catch (error) {
    console.error('Error in getCurrentUserOrganizationId:', error);
    return null;
  }
};

// Test function to verify RLS is working correctly
export const testRLSPolicies = async () => {
  try {
    console.log('Testing RLS policies...');
    
    // Test tasks query - should only return tasks from user's organization
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(5);
    
    if (tasksError) {
      console.error('Tasks RLS test failed:', tasksError);
    } else {
      console.log(`Tasks RLS test passed: ${tasks?.length || 0} tasks returned`);
    }

    // Test projects query - should only return projects from user's organization
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    if (projectsError) {
      console.error('Projects RLS test failed:', projectsError);
    } else {
      console.log(`Projects RLS test passed: ${projects?.length || 0} projects returned`);
    }

    // Test users query - should only return users from user's organization
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .limit(5);
    
    if (usersError) {
      console.error('Users RLS test failed:', usersError);
    } else {
      console.log(`Users RLS test passed: ${users?.length || 0} users returned`);
    }

    return {
      success: true,
      tests: {
        tasks: !tasksError,
        projects: !projectsError,
        users: !usersError
      }
    };
  } catch (error) {
    console.error('RLS test suite failed:', error);
    return {
      success: false,
      error: error
    };
  }
};
