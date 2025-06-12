
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

      {/* Core Tables */}
      <div>
        <h4 className="text-sm font-medium mb-2">Core Tables</h4>
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
            onClick={() => onRunIndividualTest('comments')}
            disabled={isRunning}
          >
            Test Comments
          </Button>
        </div>
      </div>

      {/* Communication Tables */}
      <div>
        <h4 className="text-sm font-medium mb-2">Communication</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRunIndividualTest('chatRooms')}
            disabled={isRunning}
          >
            Test Chat Rooms
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRunIndividualTest('chatMessages')}
            disabled={isRunning}
          >
            Test Chat Messages
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRunIndividualTest('notifications')}
            disabled={isRunning}
          >
            Test Notifications
          </Button>
        </div>
      </div>

      {/* Content & Time Tables */}
      <div>
        <h4 className="text-sm font-medium mb-2">Content & Time</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRunIndividualTest('documents')}
            disabled={isRunning}
          >
            Test Documents
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRunIndividualTest('events')}
            disabled={isRunning}
          >
            Test Events
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRunIndividualTest('timeEntries')}
            disabled={isRunning}
          >
            Test Time Entries
          </Button>
        </div>
      </div>

      {/* Organization Isolation */}
      <div>
        <h4 className="text-sm font-medium mb-2">Organization Security</h4>
        <div className="grid grid-cols-1 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRunIndividualTest('isolation')}
            disabled={isRunning}
          >
            Test Organization Isolation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TestControls;
