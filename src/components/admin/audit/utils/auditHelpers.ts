
import { supabase } from '@/integrations/supabase/client';
import { testRLSPolicies, testOrganizationIsolation } from '@/contexts/auth/utils/rlsHelpers';
import { AuditResult } from '../types';

export const performAuthenticationAudit = async (
  user: any,
  isAuthenticated: boolean,
  addResult: (section: string, status: 'success' | 'warning' | 'error', message: string, details?: any) => void
) => {
  console.log('🔍 Starting System Audit with Clean RLS...');
  
  addResult('Authentication', 'warning', 'Starting authentication audit with clean RLS policies...');
  
  if (!isAuthenticated || !user) {
    addResult('Authentication', 'error', 'User not authenticated', { isAuthenticated, user });
    return false;
  }

  addResult('Authentication', 'success', `User authenticated: ${user.email}`, {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    name: user.name
  });

  // Check organization context
  if (!user.organizationId) {
    addResult('Organization Context', 'error', 'User has no organization_id assigned');
  } else {
    addResult('Organization Context', 'success', `Organization ID: ${user.organizationId}`);
  }

  return true;
};

export const performDatabaseAudit = async (
  addResult: (section: string, status: 'success' | 'warning' | 'error', message: string, details?: any) => void
) => {
  addResult('Database Queries', 'warning', 'Testing clean RLS policies and data access...');

  // Get current user from auth.users
  const { data: authUser, error: authError } = await supabase.auth.getUser();
  if (authError) {
    addResult('Database Queries', 'error', `Auth user fetch failed: ${authError.message}`);
  } else {
    addResult('Database Queries', 'success', 'Auth user retrieved successfully', authUser.user);
  }

  // Test the RLS function directly - should now work without recursion
  const { data: orgIdFromFunction, error: orgFuncError } = await supabase.rpc('get_current_user_organization_id');
  if (orgFuncError) {
    addResult('RLS Function', 'error', `get_current_user_organization_id failed: ${orgFuncError.message}`);
  } else {
    addResult('RLS Function', 'success', `Clean RLS function returned org ID: ${orgIdFromFunction}`, { orgIdFromFunction });
  }

  // Test direct table queries with new clean policies
  const tables = [
    { name: 'Users Query (Clean RLS)', table: 'users' as const },
    { name: 'Projects Query (Clean RLS)', table: 'projects' as const },
    { name: 'Tasks Query (Clean RLS)', table: 'tasks' as const },
    { name: 'Organizations Query', table: 'organizations' as const }
  ];

  const results: any = { authUser: authUser.user, orgIdFromFunction };

  for (const { name, table } of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(10);
    
    if (error) {
      addResult(name, 'error', `${table} query failed: ${error.message}`, { error });
    } else {
      addResult(name, 'success', `Found ${data?.length || 0} ${table} with clean RLS policies`, { 
        count: data?.length || 0,
        sampleData: data?.slice(0, 2) 
      });
    }
    
    results[`${table}Data`] = data;
  }

  return results;
};

export const performRLSAudit = async (
  addResult: (section: string, status: 'success' | 'warning' | 'error', message: string, details?: any) => void
) => {
  addResult('RLS Testing', 'warning', 'Testing clean RLS policies (should work without recursion)...');
  
  try {
    const rlsTestResult = await testRLSPolicies();
    addResult('Clean RLS Policies', rlsTestResult.success ? 'success' : 'error',
      rlsTestResult.success ? 'Clean RLS policies working correctly - no infinite recursion!' : `RLS test failed: ${rlsTestResult.error}`,
      rlsTestResult);
  } catch (rlsError: any) {
    addResult('Clean RLS Policies', 'error', `RLS test failed: ${rlsError.message}`, rlsError);
  }

  try {
    const isolationTestResult = await testOrganizationIsolation();
    addResult('Organization Isolation', isolationTestResult.success ? 'success' : 'error',
      isolationTestResult.success ? 'Organization isolation working with clean policies' : `Isolation test failed: ${isolationTestResult.error}`,
      isolationTestResult);
  } catch (isolationError: any) {
    addResult('Organization Isolation', 'error', `Isolation test failed: ${isolationError.message}`, isolationError);
  }
};

export const performOrganizationDataAudit = async (
  user: any,
  addResult: (section: string, status: 'success' | 'warning' | 'error', message: string, details?: any) => void
) => {
  if (!user.organizationId) return;

  addResult('Organization Data', 'warning', 'Checking specific organization data with clean RLS...');
  
  // Check projects in user's organization with enhanced logging
  const { data: orgProjectsData, error: orgProjectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', user.organizationId);
  
  if (!orgProjectsError && orgProjectsData) {
    addResult('Organization Projects', 'success', 
      `Found ${orgProjectsData.length} projects in organization with clean RLS`,
      { 
        count: orgProjectsData.length,
        projects: orgProjectsData.map(p => ({ id: p.id, title: p.title }))
      });
  } else {
    addResult('Organization Projects', 'error', 
      `Failed to query organization projects: ${orgProjectsError?.message}`,
      { error: orgProjectsError });
  }

  // Check tasks in user's organization
  const { data: orgTasksData, error: orgTasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', user.organizationId);
  
  if (!orgTasksError && orgTasksData) {
    addResult('Organization Tasks', 'success', 
      `Found ${orgTasksData.length} tasks in organization with clean RLS`,
      { 
        count: orgTasksData.length,
        tasks: orgTasksData.map(t => ({ id: t.id, title: t.title }))
      });
  } else {
    addResult('Organization Tasks', 'error', 
      `Failed to query organization tasks: ${orgTasksError?.message}`,
      { error: orgTasksError });
  }

  // Check users in organization
  const { data: orgUsersData, error: orgUsersError } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', user.organizationId);
  
  if (!orgUsersError && orgUsersData) {
    addResult('Organization Users', 'success', 
      `Found ${orgUsersData.length} users in organization with clean RLS`,
      { 
        count: orgUsersData.length,
        users: orgUsersData.map(u => ({ id: u.id, name: u.name, email: u.email }))
      });
  } else {
    addResult('Organization Users', 'error', 
      `Failed to query organization users: ${orgUsersError?.message}`,
      { error: orgUsersError });
  }
};
