
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Shield, Play, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { 
  runComprehensiveRLSTests,
  testProjectsRLSPolicies,
  testTasksRLSPolicies,
  testUsersRLSPolicies,
  verifyOrganizationIsolation
} from '@/contexts/auth/utils/rlsTestHelpers';
import { testRLSPolicies, testOrganizationIsolation } from '@/contexts/auth/utils/rlsHelpers';

interface TestResult {
  success: boolean;
  error?: any;
  [key: string]: any;
}

const RLSTestingPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<{
    comprehensive?: any;
    projects?: TestResult;
    tasks?: TestResult;
    users?: TestResult;
    isolation?: TestResult;
    basicRLS?: TestResult;
    orgIsolation?: TestResult;
    error?: TestResult;
  }>({});

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});

    try {
      console.log('🧪 Starting comprehensive RLS test suite...');

      // Run comprehensive tests
      const comprehensiveResults = await runComprehensiveRLSTests();
      setTestResults(prev => ({ ...prev, comprehensive: comprehensiveResults }));

      // Run basic RLS tests
      const basicRLSResults = await testRLSPolicies();
      setTestResults(prev => ({ ...prev, basicRLS: basicRLSResults }));

      // Run organization isolation tests
      const orgIsolationResults = await testOrganizationIsolation();
      setTestResults(prev => ({ ...prev, orgIsolation: orgIsolationResults }));

      console.log('✅ All RLS tests completed');
    } catch (error) {
      console.error('❌ RLS test suite failed:', error);
      setTestResults(prev => ({ 
        ...prev, 
        error: { success: false, error: error } 
      }));
    } finally {
      setIsRunning(false);
    }
  };

  const runIndividualTest = async (testType: string) => {
    setIsRunning(true);

    try {
      let result: TestResult;
      
      switch (testType) {
        case 'projects':
          result = await testProjectsRLSPolicies();
          break;
        case 'tasks':
          result = await testTasksRLSPolicies();
          break;
        case 'users':
          result = await testUsersRLSPolicies();
          break;
        case 'isolation':
          result = await verifyOrganizationIsolation();
          break;
        default:
          throw new Error('Unknown test type');
      }

      setTestResults(prev => ({ ...prev, [testType]: result }));
    } catch (error) {
      console.error(`❌ ${testType} test failed:`, error);
      setTestResults(prev => ({ 
        ...prev, 
        [testType]: { success: false, error } 
      }));
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (result?: TestResult) => {
    if (!result) return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    return result.success 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (result?: TestResult) => {
    if (!result) return <Badge variant="outline">Not Run</Badge>;
    return result.success 
      ? <Badge variant="default" className="bg-green-500">Passed</Badge>
      : <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <CardTitle>RLS Testing Panel</CardTitle>
          </div>
          <CardDescription>
            Test Row Level Security policies and organization data isolation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run All Tests
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setTestResults({})}
              disabled={isRunning}
            >
              Clear Results
            </Button>
          </div>

          <Separator />

          {/* Individual Test Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => runIndividualTest('projects')}
              disabled={isRunning}
            >
              Test Projects
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => runIndividualTest('tasks')}
              disabled={isRunning}
            >
              Test Tasks
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => runIndividualTest('users')}
              disabled={isRunning}
            >
              Test Users
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => runIndividualTest('isolation')}
              disabled={isRunning}
            >
              Test Isolation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {/* Comprehensive Test Results */}
                {testResults.comprehensive && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Comprehensive Test Suite</span>
                      {getStatusBadge(testResults.comprehensive)}
                    </div>
                    <div className="text-sm text-gray-600 pl-4">
                      <div>Overall Success: {testResults.comprehensive.overallSuccess ? 'Yes' : 'No'}</div>
                      {testResults.comprehensive.projects && (
                        <div className="flex items-center gap-2">
                          {getStatusIcon(testResults.comprehensive.projects)}
                          Projects: {testResults.comprehensive.projects.success ? 'Passed' : 'Failed'}
                        </div>
                      )}
                      {testResults.comprehensive.tasks && (
                        <div className="flex items-center gap-2">
                          {getStatusIcon(testResults.comprehensive.tasks)}
                          Tasks: {testResults.comprehensive.tasks.success ? 'Passed' : 'Failed'}
                        </div>
                      )}
                      {testResults.comprehensive.users && (
                        <div className="flex items-center gap-2">
                          {getStatusIcon(testResults.comprehensive.users)}
                          Users: {testResults.comprehensive.users.success ? 'Passed' : 'Failed'}
                        </div>
                      )}
                      {testResults.comprehensive.isolation && (
                        <div className="flex items-center gap-2">
                          {getStatusIcon(testResults.comprehensive.isolation)}
                          Isolation: {testResults.comprehensive.isolation.success ? 'Passed' : 'Failed'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Basic RLS Tests */}
                {testResults.basicRLS && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Basic RLS Tests</span>
                      {getStatusBadge(testResults.basicRLS)}
                    </div>
                    <div className="text-sm text-gray-600 pl-4">
                      {testResults.basicRLS.tests && (
                        <div>
                          <div>Tasks: {testResults.basicRLS.tests.tasks ? 'Passed' : 'Failed'}</div>
                          <div>Projects: {testResults.basicRLS.tests.projects ? 'Passed' : 'Failed'}</div>
                          <div>Users: {testResults.basicRLS.tests.users ? 'Passed' : 'Failed'}</div>
                          <div>Chat Rooms: {testResults.basicRLS.tests.chatRooms ? 'Passed' : 'Failed'}</div>
                          <div>Notifications: {testResults.basicRLS.tests.notifications ? 'Passed' : 'Failed'}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Organization Isolation Tests */}
                {testResults.orgIsolation && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Organization Isolation</span>
                      {getStatusBadge(testResults.orgIsolation)}
                    </div>
                    <div className="text-sm text-gray-600 pl-4">
                      {testResults.orgIsolation.organizationId && (
                        <div>Organization ID: {testResults.orgIsolation.organizationId}</div>
                      )}
                      {testResults.orgIsolation.totalAccessibleProjects !== undefined && (
                        <div>Accessible Projects: {testResults.orgIsolation.totalAccessibleProjects}</div>
                      )}
                      {testResults.orgIsolation.totalAccessibleTasks !== undefined && (
                        <div>Accessible Tasks: {testResults.orgIsolation.totalAccessibleTasks}</div>
                      )}
                      {testResults.orgIsolation.totalAccessibleUsers !== undefined && (
                        <div>Accessible Users: {testResults.orgIsolation.totalAccessibleUsers}</div>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Individual Test Results */}
                {['projects', 'tasks', 'users', 'isolation'].map(testType => {
                  const result = testResults[testType as keyof typeof testResults] as TestResult;
                  if (!result) return null;

                  return (
                    <div key={testType} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{testType} Test</span>
                        {getStatusBadge(result)}
                      </div>
                      {result.error && (
                        <div className="text-sm text-red-600 pl-4">
                          Error: {result.error.message || JSON.stringify(result.error)}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 pl-4">
                        {Object.entries(result).map(([key, value]) => {
                          if (key === 'success' || key === 'error') return null;
                          return (
                            <div key={key}>
                              {key}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Error Display */}
                {testResults.error && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-red-600">Test Suite Error</span>
                      <Badge variant="destructive">Failed</Badge>
                    </div>
                    <div className="text-sm text-red-600 pl-4">
                      {testResults.error.error?.message || JSON.stringify(testResults.error.error)}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RLSTestingPanel;
