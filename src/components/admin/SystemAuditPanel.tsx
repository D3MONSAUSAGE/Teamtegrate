
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { testRLSPolicies, testOrganizationIsolation } from '@/contexts/auth/utils/rlsHelpers';
import { AlertCircle, CheckCircle, XCircle, User, Database, Shield, Code } from 'lucide-react';

interface AuditResult {
  section: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

const SystemAuditPanel = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [rawData, setRawData] = useState<any>({});

  const addResult = (section: string, status: 'success' | 'warning' | 'error', message: string, details?: any) => {
    setAuditResults(prev => [...prev, { section, status, message, details }]);
  };

  const runSystemAudit = async () => {
    setIsRunning(true);
    setAuditResults([]);
    setRawData({});

    try {
      // 1. Authentication & Context Setup
      console.log('🔍 Starting System Audit...');
      
      addResult('Authentication', 'info', 'Starting authentication audit...');
      
      if (!isAuthenticated || !user) {
        addResult('Authentication', 'error', 'User not authenticated', { isAuthenticated, user });
        setIsRunning(false);
        return;
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

      // 2. Direct database queries to verify data existence
      addResult('Database Queries', 'info', 'Checking direct database access...');

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

      // Check users table directly
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(10);
      
      addResult('Users Query', usersError ? 'error' : 'success', 
        usersError ? `Users query failed: ${usersError.message}` : `Found ${usersData?.length || 0} users`,
        { usersError, usersData });

      // Check projects table directly  
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .limit(10);
      
      addResult('Projects Query', projectsError ? 'error' : 'success',
        projectsError ? `Projects query failed: ${projectsError.message}` : `Found ${projectsData?.length || 0} projects`,
        { projectsError, projectsData });

      // Check tasks table directly
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .limit(10);
      
      addResult('Tasks Query', tasksError ? 'error' : 'success',
        tasksError ? `Tasks query failed: ${tasksError.message}` : `Found ${tasksData?.length || 0} tasks`,
        { tasksError, tasksData });

      // Check organizations table
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*');
      
      addResult('Organizations Query', orgsError ? 'error' : 'success',
        orgsError ? `Organizations query failed: ${orgsError.message}` : `Found ${orgsData?.length || 0} organizations`,
        { orgsError, orgsData });

      // 3. Test RLS policies
      addResult('RLS Testing', 'info', 'Testing RLS policies...');
      
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

      // 4. Check for data in specific organization
      if (user.organizationId) {
        addResult('Organization Data', 'info', 'Checking data in user organization...');
        
        // Use raw SQL to bypass RLS and check actual data
        const { data: rawProjectsData, error: rawProjectsError } = await supabase
          .rpc('query_projects_raw', { org_id: user.organizationId });
        
        if (!rawProjectsError && rawProjectsData) {
          addResult('Raw Projects Query', 'success', `Raw query found ${rawProjectsData.length} projects in organization`);
        }
      }

      // Store raw data for inspection
      setRawData({
        user,
        authUser: authUser.user,
        orgIdFromFunction,
        usersData,
        projectsData,
        tasksData,
        orgsData
      });

    } catch (error: any) {
      addResult('System', 'error', `Audit failed: ${error.message}`, error);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Audit Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runSystemAudit} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? 'Running Audit...' : 'Run Complete System Audit'}
            </Button>

            {/* Current User Context */}
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Current User Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="font-medium">Email:</span>
                    <span>{user.email}</span>
                    <span className="font-medium">Role:</span>
                    <span>{user.role}</span>
                    <span className="font-medium">Organization ID:</span>
                    <span className="font-mono text-xs">{user.organizationId || 'NOT SET'}</span>
                    <span className="font-medium">User ID:</span>
                    <span className="font-mono text-xs">{user.id}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audit Results */}
            {auditResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Audit Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditResults.map((result, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getStatusIcon(result.status)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusColor(result.status)}>
                              {result.section}
                            </Badge>
                          </div>
                          <p className="text-sm">{result.message}</p>
                          {result.details && (
                            <details className="text-xs text-gray-600">
                              <summary className="cursor-pointer">View Details</summary>
                              <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-40">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Raw Data Inspector */}
            {Object.keys(rawData).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Raw Data Inspector
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <details>
                    <summary className="cursor-pointer text-sm font-medium">View Raw Data</summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-96 text-xs">
                      {JSON.stringify(rawData, null, 2)}
                    </pre>
                  </details>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAuditPanel;
