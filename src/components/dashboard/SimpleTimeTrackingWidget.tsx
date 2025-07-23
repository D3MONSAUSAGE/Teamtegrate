
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Play, Square } from 'lucide-react';
import { useTimeTrackingPage } from '@/hooks/useTimeTrackingPage';

const SimpleTimeTrackingWidget: React.FC = () => {
  const { currentEntry, elapsedTime, clockIn, clockOut, isLoading, breakState } = useTimeTrackingPage();
  
  const isActivelyWorking = currentEntry.isClocked && !breakState.isOnBreak;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Time Tracking</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isActivelyWorking ? `Session: ${elapsedTime}` : 'Ready to start'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isActivelyWorking && (
            <div className="flex items-center gap-2 mr-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-mono text-gray-900 dark:text-white">{elapsedTime}</span>
            </div>
          )}
          
          <Button
            onClick={isActivelyWorking ? () => clockOut() : () => clockIn()}
            disabled={isLoading}
            variant={isActivelyWorking ? "destructive" : "default"}
            className={isActivelyWorking ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            {isActivelyWorking ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Clock Out
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Clock In
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleTimeTrackingWidget;
