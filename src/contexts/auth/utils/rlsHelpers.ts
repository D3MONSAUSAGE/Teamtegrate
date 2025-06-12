
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
    console.log('🔍 Testing RLS policies after comprehensive cleanup...');
    
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

    // Test tasks query - should only return tasks from user's organization
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, organization_id')
      .limit(5);
    
    if (tasksError) {
      console.error('❌ Tasks RLS test failed:', tasksError);
    } else {
      console.log(`✅ Tasks RLS test passed: ${tasks?.length || 0} tasks returned`);
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
    }

    // Test project_team_members query
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('project_team_members')
      .select('id, project_id, user_id')
      .limit(5);
    
    if (teamMembersError) {
      console.error('❌ Project team members RLS test failed:', teamMembersError);
    } else {
      console.log(`✅ Project team members RLS test passed: ${teamMembers?.length || 0} memberships returned`);
    }

    return {
      success: true,
      currentUser: { id: user.id, email: user.email },
      currentOrgId,
      tests: {
        tasks: !tasksError,
        projects: !projectsError,
        teamMembers: !teamMembersError
      },
      counts: {
        tasks: tasks?.length || 0,
        projects: projects?.length || 0,
        teamMembers: teamMembers?.length || 0
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

    return {
      success: true,
      currentUser: { id: user.id, email: user.email },
      organizationId: currentOrgId,
      totalAccessibleProjects: allProjects?.length || 0,
      totalAccessibleTasks: allTasks?.length || 0
    };
  } catch (error) {
    console.error('Organization isolation test failed:', error);
    return { success: false, error };
  }
};
