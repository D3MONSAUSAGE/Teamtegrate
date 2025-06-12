
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { TestResults as TestResultsType, TestResult } from '../types';
import ComprehensiveTestResults from './ComprehensiveTestResults';
import BasicRLSTestResults from './BasicRLSTestResults';
import OrganizationIsolationResults from './OrganizationIsolationResults';
import IndividualTestResult from './IndividualTestResult';

interface TestResultsProps {
  testResults: TestResultsType;
}

const TestResults: React.FC<TestResultsProps> = ({ testResults }) => {
  if (Object.keys(testResults).length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Results</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {/* Comprehensive Test Results */}
            {testResults.comprehensive && (
              <ComprehensiveTestResults results={testResults.comprehensive} />
            )}

            <Separator />

            {/* Basic RLS Tests */}
            {testResults.basicRLS && (
              <BasicRLSTestResults results={testResults.basicRLS} />
            )}

            {/* Organization Isolation Tests */}
            {testResults.orgIsolation && (
              <OrganizationIsolationResults results={testResults.orgIsolation} />
            )}

            <Separator />

            {/* Individual Test Results */}
            {['projects', 'tasks', 'users', 'isolation'].map(testType => {
              const result = testResults[testType as keyof TestResultsType] as TestResult;
              if (!result) return null;

              return (
                <IndividualTestResult 
                  key={testType} 
                  testType={testType} 
                  result={result} 
                />
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
  );
};

export default TestResults;
