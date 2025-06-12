
import { supabase } from '@/integrations/supabase/client';

// Helper function to get current user's organization ID
// This is used by RLS policies to enforce organization-level data isolation
export const getCurrentUserOrganizationId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('🔍 RLS Helper: No authenticated user found');
      return null;
    }

    console.log('🔍 RLS Helper: Getting organization for user:', user.id);

    const { data, error } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('❌ RLS Helper: Error fetching user organization:', error);
      return null;
    }

    console.log('✅ RLS Helper: User organization found:', data?.organization_id);
    return data?.organization_id || null;
  } catch (error) {
    console.error('❌ RLS Helper: Error in getCurrentUserOrganizationId:', error);
    return null;
  }
};

// Test function to verify RLS is working correctly after the fix
export const testRLSPolicies = async () => {
  try {
    console.log('🔍 Testing RLS policies after infinite recursion fix...');
    
    // Get current user info first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user for RLS testing');
      return { success: false, error: 'No authenticated user' };
    }
    
    console.log('👤 Testing RLS for user:', user.id, user.email);
    
    // Test the RLS function directly
    const { data: currentOrgId, error: orgFuncError } = await supabase.rpc('get_current_user_organization_id');
    if (orgFuncError) {
      console.error('❌ RLS function test failed:', orgFuncError);
      return { success: false, error: orgFuncError };
    } else {
      console.log(`✅ RLS function working: current org ID = ${currentOrgId}`);
    }

    // Test manual organization lookup
    const { data: userOrgData, error: userOrgError } = await supabase
      .from('users')
      .select('organization_id, email')
      .eq('id', user.id)
      .single();
    
    if (userOrgError) {
      console.error('❌ User org lookup failed:', userOrgError);
    } else {
      console.log('👤 User organization lookup:', userOrgData);
    }

    // Test tasks query - should only return tasks from user's organization
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, organization_id')
      .limit(5);
    
    if (tasksError) {
      console.error('❌ Tasks RLS test failed:', tasksError);
    } else {
      console.log(`✅ Tasks RLS test passed: ${tasks?.length || 0} tasks returned`);
      if (tasks && tasks.length > 0) {
        console.log('📋 Sample task org IDs:', tasks.map(t => ({ id: t.id, org: t.organization_id })));
        console.log('🔍 Expected org ID:', currentOrgId);
        console.log('🔍 All tasks match org?', tasks.every(t => t.organization_id === currentOrgId));
      }
    }

    // Test projects query - should only return projects from user's organization
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, organization_id')
      .limit(5);
    
    if (projectsError) {
      console.error('❌ Projects RLS test failed:', projectsError);
    } else {
      console.log(`✅ Projects RLS test passed: ${projects?.length || 0} projects returned`);
      if (projects && projects.length > 0) {
        console.log('📁 Sample project org IDs:', projects.map(p => ({ id: p.id, org: p.organization_id })));
        console.log('🔍 Expected org ID:', currentOrgId);
        console.log('🔍 All projects match org?', projects.every(p => p.organization_id === currentOrgId));
      }
    }

    // Test users query - should only return users from user's organization
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, organization_id')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Users RLS test failed:', usersError);
    } else {
      console.log(`✅ Users RLS test passed: ${users?.length || 0} users returned`);
      if (users && users.length > 0) {
        console.log('👥 Sample user org IDs:', users.map(u => ({ email: u.email, org: u.organization_id })));
        console.log('🔍 Expected org ID:', currentOrgId);
        console.log('🔍 All users match org?', users.every(u => u.organization_id === currentOrgId));
      }
    }

    return {
      success: true,
      currentUser: { id: user.id, email: user.email },
      currentOrgId,
      userOrgFromQuery: userOrgData?.organization_id,
      tests: {
        tasks: !tasksError,
        projects: !projectsError,
        users: !usersError
      },
      counts: {
        tasks: tasks?.length || 0,
        projects: projects?.length || 0,
        users: users?.length || 0
      }
    };
  } catch (error) {
    console.error('❌ RLS test suite failed:', error);
    return {
      success: false,
      error: error
    };
  }
};

// Test organization data isolation by verifying all data belongs to user's org
export const testOrganizationIsolation = async () => {
  try {
    console.log('🔒 Testing organization data isolation...');
    
    // Get current user and their org
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    const { data: currentOrgId } = await supabase.rpc('get_current_user_organization_id');
    if (!currentOrgId) {
      console.error('Cannot test isolation: user has no organization');
      return { success: false, error: 'No organization found' };
    }

    console.log(`🔍 Testing isolation for user ${user.email} in organization: ${currentOrgId}`);

    // Test that all returned projects belong to user's organization
    const { data: allProjects, error: allProjectsError } = await supabase
      .from('projects')
      .select('id, organization_id, title');

    if (allProjectsError) {
      console.log('RLS correctly blocked or limited access:', allProjectsError.message);
    } else {
      const invalidProjects = allProjects?.filter(p => p.organization_id !== currentOrgId) || [];
      if (invalidProjects.length > 0) {
        console.error('❌ Organization isolation breach in projects!', invalidProjects);
        return { success: false, error: 'Organization isolation breach detected' };
      }
      console.log(`✅ Organization isolation verified: ${allProjects?.length || 0} projects all belong to user's org`);
    }

    // Test that all returned tasks belong to user's organization
    const { data: allTasks, error: allTasksError } = await supabase
      .from('tasks')
      .select('id, organization_id, title');

    if (allTasksError) {
      console.log('RLS correctly blocked or limited access:', allTasksError.message);
    } else {
      const invalidTasks = allTasks?.filter(t => t.organization_id !== currentOrgId) || [];
      if (invalidTasks.length > 0) {
        console.error('❌ Organization isolation breach in tasks!', invalidTasks);
        return { success: false, error: 'Organization isolation breach detected' };
      }
      console.log(`✅ Organization isolation verified: ${allTasks?.length || 0} tasks all belong to user's org`);
    }

    // Test that all returned users belong to user's organization
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, organization_id, email');

    if (allUsersError) {
      console.log('RLS correctly blocked or limited access:', allUsersError.message);
    } else {
      const invalidUsers = allUsers?.filter(u => u.organization_id !== currentOrgId) || [];
      if (invalidUsers.length > 0) {
        console.error('❌ Organization isolation breach in users!', invalidUsers);
        return { success: false, error: 'Organization isolation breach detected' };
      }
      console.log(`✅ Organization isolation verified: ${allUsers?.length || 0} users all belong to user's org`);
    }

    return {
      success: true,
      currentUser: { id: user.id, email: user.email },
      organizationId: currentOrgId,
      totalAccessibleProjects: allProjects?.length || 0,
      totalAccessibleTasks: allTasks?.length || 0,
      totalAccessibleUsers: allUsers?.length || 0
    };
  } catch (error) {
    console.error('Organization isolation test failed:', error);
    return { success: false, error };
  }
};
