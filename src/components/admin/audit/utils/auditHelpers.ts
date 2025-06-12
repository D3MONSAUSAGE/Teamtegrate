
import { supabase } from '@/integrations/supabase/client';
import { testRLSPolicies, testOrganizationIsolation } from '@/contexts/auth/utils/rlsHelpers';
import { AuditResult } from '../types';

export const performAuthenticationAudit = async (
  user: any,
  isAuthenticated: boolean,
  addResult: (section: string, status: 'success' | 'warning' | 'error', message: string, details?: any) => void
) => {
  console.log('🔍 Starting System Audit...');
  
  addResult('Authentication', 'warning', 'Starting authentication audit...');
  
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
  addResult('Database Queries', 'warning', 'Checking direct database access...');

  // Get current user from auth.users
  const { data: authUser, error: authError } = await supabase.auth.getUser();
  if (authError) {
    addResult('Database Queries', 'error', `Auth user fetch failed: ${authError.message}`);
  } else {
    addResult('Database Queries', 'success', 'Auth user retrieved successfully', authUser.user);
  }

  // Test the RLS function directly
  const { data: orgIdFromFunction, error: orgFuncError } = await supabase.rpc('get_current_user_organization_id');
  if (orgFuncError) {
    addResult('RLS Function', 'error', `get_current_user_organization_id failed: ${orgFuncError.message}`);
  } else {
    addResult('RLS Function', 'success', `Function returned org ID: ${orgIdFromFunction}`, { orgIdFromFunction });
  }

  // Test direct table queries
  const tables = [
    { name: 'Users Query', table: 'users' as const },
    { name: 'Projects Query', table: 'projects' as const },
    { name: 'Tasks Query', table: 'tasks' as const },
    { name: 'Organizations Query', table: 'organizations' as const }
  ];

  const results: any = { authUser: authUser.user, orgIdFromFunction };

  for (const { name, table } of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(10);
    
    addResult(name, error ? 'error' : 'success', 
      error ? `${table} query failed: ${error.message}` : `Found ${data?.length || 0} ${table}`,
      { error, data });
    
    results[`${table}Data`] = data;
  }

  return results;
};

export const performRLSAudit = async (
  addResult: (section: string, status: 'success' | 'warning' | 'error', message: string, details?: any) => void
) => {
  addResult('RLS Testing', 'warning', 'Testing RLS policies...');
  
  try {
    const rlsTestResult = await testRLSPolicies();
    addResult('RLS Policies', rlsTestResult.success ? 'success' : 'error',
      rlsTestResult.success ? 'RLS policies working correctly' : `RLS test failed: ${rlsTestResult.error}`,
      rlsTestResult);
  } catch (rlsError: any) {
    addResult('RLS Policies', 'error', `RLS test failed: ${rlsError.message}`, rlsError);
  }

  try {
    const isolationTestResult = await testOrganizationIsolation();
    addResult('Organization Isolation', isolationTestResult.success ? 'success' : 'error',
      isolationTestResult.success ? 'Organization isolation working' : `Isolation test failed: ${isolationTestResult.error}`,
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

  addResult('Organization Data', 'warning', 'Checking data in user organization...');
  
  // Check projects in user's organization by filtering directly
  const { data: orgProjectsData, error: orgProjectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', user.organizationId);
  
  if (!orgProjectsError && orgProjectsData) {
    addResult('Organization Projects', 'success', `Found ${orgProjectsData.length} projects in organization`);
  } else {
    addResult('Organization Projects', 'error', `Failed to query organization projects: ${orgProjectsError?.message}`);
  }
};
