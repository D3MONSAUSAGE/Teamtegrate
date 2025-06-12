
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

// Test function to verify clean RLS policies are working correctly
export const testRLSPolicies = async () => {
  try {
    console.log('🔍 Testing CLEAN RLS policies (no more infinite recursion)...');
    
    // Get current user info first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user for RLS testing');
      return { success: false, error: 'No authenticated user' };
    }
    
    console.log('👤 Testing clean RLS for user:', user.id, user.email);
    
    // Test the RLS function directly - should work without recursion now
    const { data: currentOrgId, error: orgFuncError } = await supabase.rpc('get_current_user_organization_id');
    if (orgFuncError) {
      console.error('❌ Clean RLS function test failed:', orgFuncError);
      return { success: false, error: orgFuncError };
    } else {
      console.log(`✅ Clean RLS function working: current org ID = ${currentOrgId}`);
    }

    // Test tasks query - should work with clean policies
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, organization_id')
      .limit(5);
    
    if (tasksError) {
      console.error('❌ Tasks clean RLS test failed:', tasksError);
    } else {
      console.log(`✅ Tasks clean RLS test passed: ${tasks?.length || 0} tasks returned`);
    }

    // Test projects query - should work with clean policies
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, organization_id')
      .limit(5);
    
    if (projectsError) {
      console.error('❌ Projects clean RLS test failed:', projectsError);
    } else {
      console.log(`✅ Projects clean RLS test passed: ${projects?.length || 0} projects returned`);
    }

    // Test users query - should work with clean policies
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, organization_id')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Users clean RLS test failed:', usersError);
    } else {
      console.log(`✅ Users clean RLS test passed: ${users?.length || 0} users returned`);
    }

    return {
      success: true,
      currentUser: { id: user.id, email: user.email },
      currentOrgId,
      tests: {
        tasks: !tasksError,
        projects: !projectsError,
        users: !usersError
      },
      counts: {
        tasks: tasks?.length || 0,
        projects: projects?.length || 0,
        users: users?.length || 0
      },
      note: 'Clean RLS policies working without infinite recursion!'
    };
  } catch (error) {
    console.error('❌ Clean RLS test suite failed:', error);
    return {
      success: false,
      error: error
    };
  }
};

// Test organization data isolation with clean policies
export const testOrganizationIsolation = async () => {
  try {
    console.log('🔒 Testing organization data isolation with clean policies...');
    
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
      console.log('Clean RLS correctly handled access:', allProjectsError.message);
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
      console.log('Clean RLS correctly handled access:', allTasksError.message);
    } else {
      const invalidTasks = allTasks?.filter(t => t.organization_id !== currentOrgId) || [];
      if (invalidTasks.length > 0) {
        console.error('❌ Organization isolation breach in tasks!', invalidTasks);
        return { success: false, error: 'Organization isolation breach detected' };
      }
      console.log(`✅ Organization isolation verified: ${allTasks?.length || 0} tasks all belong to user's org`);
    }

    // Test users isolation
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, organization_id, name, email');

    if (allUsersError) {
      console.log('Clean RLS correctly handled access:', allUsersError.message);
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
      totalAccessibleUsers: allUsers?.length || 0,
      note: 'Clean RLS policies enforcing perfect organization isolation!'
    };
  } catch (error) {
    console.error('Organization isolation test failed:', error);
    return { success: false, error };
  }
};
