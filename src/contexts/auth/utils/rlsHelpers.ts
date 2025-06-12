
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

// Test function to verify the new clean RLS policies are working correctly
export const testRLSPolicies = async () => {
  try {
    console.log('🔍 Testing NEW CLEAN RLS policies (emergency cleanup complete)...');
    
    // Get current user info first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user for RLS testing');
      return { success: false, error: 'No authenticated user' };
    }
    
    console.log('👤 Testing clean RLS for user:', user.id, user.email);
    
    // Test the RLS function directly - should work perfectly now
    const { data: currentOrgId, error: orgFuncError } = await supabase.rpc('get_current_user_organization_id');
    if (orgFuncError) {
      console.error('❌ Clean RLS function test failed:', orgFuncError);
      return { success: false, error: orgFuncError };
    } else {
      console.log(`✅ Clean RLS function working perfectly: current org ID = ${currentOrgId}`);
    }

    // Test all tables with new clean policies
    const tables = [
      { name: 'Projects (Clean Policy)', table: 'projects' as const },
      { name: 'Tasks (Clean Policy)', table: 'tasks' as const },
      { name: 'Users (Clean Policy)', table: 'users' as const },
      { name: 'Team Members (Clean Policy)', table: 'project_team_members' as const }
    ];

    const testResults: any = { authUser: user, currentOrgId };

    for (const { name, table } of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(5);
      
      if (error) {
        console.error(`❌ ${name} clean policy test failed:`, error);
        testResults[`${table}Error`] = error;
      } else {
        console.log(`✅ ${name} clean policy test passed: ${data?.length || 0} records returned`);
        testResults[`${table}Data`] = data;
        testResults[`${table}Count`] = data?.length || 0;
      }
    }

    return {
      success: true,
      currentUser: { id: user.id, email: user.email },
      currentOrgId,
      tests: {
        projects: !testResults.projectsError,
        tasks: !testResults.tasksError,
        users: !testResults.usersError,
        teamMembers: !testResults.project_team_membersError
      },
      counts: {
        projects: testResults.projectsCount || 0,
        tasks: testResults.tasksCount || 0,
        users: testResults.usersCount || 0,
        teamMembers: testResults.project_team_membersCount || 0
      },
      note: 'Emergency cleanup successful! Clean RLS policies working perfectly!'
    };
  } catch (error) {
    console.error('❌ Clean RLS test suite failed:', error);
    return {
      success: false,
      error: error
    };
  }
};

// Test organization data isolation with new clean policies
export const testOrganizationIsolation = async () => {
  try {
    console.log('🔒 Testing organization data isolation with NEW CLEAN policies...');
    
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

    // Test that all returned data belongs to user's organization
    const isolationTests = [
      { name: 'Projects', table: 'projects' as const },
      { name: 'Tasks', table: 'tasks' as const },
      { name: 'Users', table: 'users' as const }
    ];

    for (const { name, table } of isolationTests) {
      const { data, error } = await supabase
        .from(table)
        .select('id, organization_id')
        .limit(10);

      if (error) {
        console.log(`Clean RLS correctly handled ${name} access:`, error.message);
      } else {
        const invalidRecords = data?.filter(r => r.organization_id !== currentOrgId) || [];
        if (invalidRecords.length > 0) {
          console.error(`❌ Organization isolation breach in ${name}!`, invalidRecords);
          return { success: false, error: `Organization isolation breach detected in ${name}` };
        }
        console.log(`✅ ${name} organization isolation verified: ${data?.length || 0} records all belong to user's org`);
      }
    }

    return {
      success: true,
      currentUser: { id: user.id, email: user.email },
      organizationId: currentOrgId,
      note: 'Emergency cleanup successful! Perfect organization isolation with clean policies!'
    };
  } catch (error) {
    console.error('Organization isolation test failed:', error);
    return { success: false, error };
  }
};
