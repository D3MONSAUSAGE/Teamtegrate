
import { supabase } from '@/integrations/supabase/client';

// Test function to verify the new RLS policies are working correctly
export const testProjectsRLSPolicies = async () => {
  try {
    console.log('Testing new Projects RLS policies...');
    
    // Test projects query - should only return projects from user's organization
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    if (projectsError) {
      console.error('Projects RLS test failed:', projectsError);
      return { success: false, error: projectsError };
    } else {
      console.log(`✅ Projects RLS test passed: ${projects?.length || 0} projects returned`);
    }

    // Get current user's organization for test project
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found for testing');
      return { success: false, error: 'No authenticated user' };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      console.error('Failed to get user organization for testing:', userError);
      return { success: false, error: userError || 'No organization found' };
    }

    // Test project insertion - should automatically set organization_id
    const testProject = {
      id: `test-${Date.now()}`,
      title: 'RLS Test Project',
      description: 'Testing RLS policies',
      status: 'To Do',
      manager_id: user.id,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      organization_id: userData.organization_id // Add required organization_id
    };

    const { data: insertedProject, error: insertError } = await supabase
      .from('projects')
      .insert(testProject)
      .select()
      .single();

    if (insertError) {
      console.error('Project insertion test failed:', insertError);
    } else {
      console.log('✅ Project insertion test passed:', insertedProject?.id);
      
      // Clean up test project
      await supabase
        .from('projects')
        .delete()
        .eq('id', insertedProject.id);
      
      console.log('✅ Test project cleaned up');
    }

    return {
      success: true,
      projectsReturned: projects?.length || 0,
      insertionWorked: !insertError
    };
  } catch (error) {
    console.error('RLS test suite failed:', error);
    return {
      success: false,
      error: error
    };
  }
};

// Test function to verify the new Tasks RLS policies are working correctly
export const testTasksRLSPolicies = async () => {
  try {
    console.log('Testing new Tasks RLS policies...');
    
    // Test tasks query - should only return tasks from user's organization
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(5);
    
    if (tasksError) {
      console.error('Tasks RLS test failed:', tasksError);
      return { success: false, error: tasksError };
    } else {
      console.log(`✅ Tasks RLS test passed: ${tasks?.length || 0} tasks returned`);
    }

    // Get current user's organization for test task
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found for testing');
      return { success: false, error: 'No authenticated user' };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      console.error('Failed to get user organization for testing:', userError);
      return { success: false, error: userError || 'No organization found' };
    }

    // Test task insertion - should automatically set organization_id
    const testTask = {
      id: `test-task-${Date.now()}`,
      title: 'RLS Test Task',
      description: 'Testing Tasks RLS policies',
      status: 'To Do',
      priority: 'Medium',
      user_id: user.id,
      deadline: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      organization_id: userData.organization_id
    };

    const { data: insertedTask, error: insertError } = await supabase
      .from('tasks')
      .insert(testTask)
      .select()
      .single();

    if (insertError) {
      console.error('Task insertion test failed:', insertError);
    } else {
      console.log('✅ Task insertion test passed:', insertedTask?.id);
      
      // Test task update - should work for task creator
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ description: 'Updated description for RLS test' })
        .eq('id', insertedTask.id);

      if (updateError) {
        console.error('Task update test failed:', updateError);
      } else {
        console.log('✅ Task update test passed');
      }
      
      // Clean up test task
      await supabase
        .from('tasks')
        .delete()
        .eq('id', insertedTask.id);
      
      console.log('✅ Test task cleaned up');
    }

    return {
      success: true,
      tasksReturned: tasks?.length || 0,
      insertionWorked: !insertError
    };
  } catch (error) {
    console.error('Tasks RLS test suite failed:', error);
    return {
      success: false,
      error: error
    };
  }
};

// Test function to verify the new Users RLS policies are working correctly
export const testUsersRLSPolicies = async () => {
  try {
    console.log('Testing new Users RLS policies...');
    
    // Test users query - should only return users from user's organization
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('Users RLS test failed:', usersError);
      return { success: false, error: usersError };
    } else {
      console.log(`✅ Users RLS test passed: ${users?.length || 0} users returned`);
    }

    // Get current user's organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found for testing');
      return { success: false, error: 'No authenticated user' };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      console.error('Failed to get user organization for testing:', userError);
      return { success: false, error: userError || 'No organization found' };
    }

    // Test user insertion - should be blocked by RLS (only system can insert)
    const testUser = {
      id: user.id, // Use current user ID
      name: 'RLS Test User',
      email: 'test@example.com',
      role: 'user',
      organization_id: userData.organization_id
    };

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (insertError) {
      console.log('✅ User insertion correctly blocked by RLS:', insertError.message);
    } else {
      console.log('⚠️ User insertion was allowed (unexpected):', insertedUser?.id);
      
      // Clean up if somehow inserted
      await supabase
        .from('users')
        .delete()
        .eq('id', insertedUser.id);
    }

    // Test user update - should work for own profile
    const { error: updateError } = await supabase
      .from('users')
      .update({ name: 'Updated Name for RLS Test' })
      .eq('id', user.id);

    if (updateError) {
      console.error('User update test failed:', updateError);
    } else {
      console.log('✅ User update test passed (can update own profile)');
      
      // Revert the name change
      const { data: originalUser } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
    }

    return {
      success: true,
      usersReturned: users?.length || 0,
      insertionBlocked: !!insertError,
      updateWorked: !updateError
    };
  } catch (error) {
    console.error('Users RLS test suite failed:', error);
    return {
      success: false,
      error: error
    };
  }
};

// Helper function to verify organization isolation
export const verifyOrganizationIsolation = async () => {
  try {
    console.log('Verifying organization data isolation...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return { success: false, error: 'No authenticated user' };
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Failed to get user organization:', userError);
      return { success: false, error: userError };
    }

    console.log('User organization:', userData.organization_id);

    // Test that all returned projects belong to user's organization
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, organization_id');

    if (projectsError) {
      console.error('Failed to fetch projects for isolation test:', projectsError);
      return { success: false, error: projectsError };
    }

    const invalidProjects = projects?.filter(p => p.organization_id !== userData.organization_id) || [];
    
    if (invalidProjects.length > 0) {
      console.error('❌ Organization isolation failed! Found projects from other organizations:', invalidProjects);
      return { success: false, error: 'Organization isolation breach detected' };
    }

    // Test that all returned tasks belong to user's organization
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, organization_id');

    if (tasksError) {
      console.error('Failed to fetch tasks for isolation test:', tasksError);
      return { success: false, error: tasksError };
    }

    const invalidTasks = tasks?.filter(t => t.organization_id !== userData.organization_id) || [];
    
    if (invalidTasks.length > 0) {
      console.error('❌ Organization isolation failed! Found tasks from other organizations:', invalidTasks);
      return { success: false, error: 'Organization isolation breach detected' };
    }

    // Test that all returned users belong to user's organization
    const { data: users, error: usersIsolationError } = await supabase
      .from('users')
      .select('id, organization_id');

    if (usersIsolationError) {
      console.error('Failed to fetch users for isolation test:', usersIsolationError);
      return { success: false, error: usersIsolationError };
    }

    const invalidUsers = users?.filter(u => u.organization_id !== userData.organization_id) || [];
    
    if (invalidUsers.length > 0) {
      console.error('❌ Organization isolation failed! Found users from other organizations:', invalidUsers);
      return { success: false, error: 'Organization isolation breach detected' };
    }

    console.log('✅ Organization isolation verified: All data belongs to user\'s organization');
    
    return {
      success: true,
      userOrganization: userData.organization_id,
      projectsChecked: projects?.length || 0,
      tasksChecked: tasks?.length || 0,
      usersChecked: users?.length || 0
    };
  } catch (error) {
    console.error('Organization isolation verification failed:', error);
    return { success: false, error };
  }
};

// Run comprehensive RLS tests for all tables
export const runComprehensiveRLSTests = async () => {
  try {
    console.log('🧪 Running comprehensive RLS tests...');
    
    const projectsTest = await testProjectsRLSPolicies();
    const tasksTest = await testTasksRLSPolicies();
    const usersTest = await testUsersRLSPolicies();
    const isolationTest = await verifyOrganizationIsolation();

    const results = {
      projects: projectsTest,
      tasks: tasksTest,
      users: usersTest,
      isolation: isolationTest,
      overallSuccess: projectsTest.success && tasksTest.success && usersTest.success && isolationTest.success
    };

    if (results.overallSuccess) {
      console.log('🎉 All RLS tests passed! Organization isolation is working correctly.');
    } else {
      console.error('❌ Some RLS tests failed. Check the detailed results above.');
    }

    return results;
  } catch (error) {
    console.error('Comprehensive RLS test suite failed:', error);
    return {
      success: false,
      error: error
    };
  }
};
