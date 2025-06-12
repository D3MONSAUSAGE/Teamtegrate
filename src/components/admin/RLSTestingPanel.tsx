
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield } from 'lucide-react';
import { useRLSTests } from './hooks/useRLSTests';
import TestControls from './components/TestControls';
import TestResults from './components/TestResults';

const RLSTestingPanel: React.FC = () => {
  const { isRunning, testResults, runAllTests, runIndividualTest, clearResults } = useRLSTests();

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
        <CardContent>
          <TestControls
            isRunning={isRunning}
            onRunAllTests={runAllTests}
            onClearResults={clearResults}
            onRunIndividualTest={runIndividualTest}
          />
          <Separator className="my-4" />
        </CardContent>
      </Card>

      <TestResults testResults={testResults} />
    </div>
  );
};

export default RLSTestingPanel;
