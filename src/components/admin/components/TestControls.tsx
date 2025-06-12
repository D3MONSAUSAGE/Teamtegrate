
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, RefreshCw } from 'lucide-react';

interface TestControlsProps {
  isRunning: boolean;
  onRunAllTests: () => void;
  onClearResults: () => void;
  onRunIndividualTest: (testType: string) => void;
}

const TestControls: React.FC<TestControlsProps> = ({
  isRunning,
  onRunAllTests,
  onClearResults,
  onRunIndividualTest
}) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          onClick={onRunAllTests} 
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
          onClick={onClearResults}
          disabled={isRunning}
        >
          Clear Results
        </Button>
      </div>

      {/* Individual Test Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onRunIndividualTest('projects')}
          disabled={isRunning}
        >
          Test Projects
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onRunIndividualTest('tasks')}
          disabled={isRunning}
        >
          Test Tasks
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onRunIndividualTest('users')}
          disabled={isRunning}
        >
          Test Users
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onRunIndividualTest('isolation')}
          disabled={isRunning}
        >
          Test Isolation
        </Button>
      </div>
    </div>
  );
};

export default TestControls;
