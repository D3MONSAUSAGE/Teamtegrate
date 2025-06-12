
import { useState } from 'react';
import { TestResults, TestResult } from '../types';
import { 
  runComprehensiveRLSTests,
  testProjectsRLSPolicies,
  testTasksRLSPolicies,
  testUsersRLSPolicies,
  verifyOrganizationIsolation
} from '@/contexts/auth/utils/rlsTestHelpers';
import { testRLSPolicies, testOrganizationIsolation } from '@/contexts/auth/utils/rlsHelpers';

export const useRLSTests = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResults>({});

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

  const clearResults = () => setTestResults({});

  return {
    isRunning,
    testResults,
    runAllTests,
    runIndividualTest,
    clearResults
  };
};
