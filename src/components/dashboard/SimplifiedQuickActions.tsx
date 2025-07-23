
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Focus, BarChart3, Settings } from 'lucide-react';

interface SimplifiedQuickActionsProps {
  onCreateTask: () => void;
}

const SimplifiedQuickActions: React.FC<SimplifiedQuickActionsProps> = ({ onCreateTask }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Quick Actions</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Access your most-used features quickly
      </p>
      
      <div className="grid grid-cols-4 gap-3">
        <Button
          onClick={onCreateTask}
          className="bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center py-4 h-auto"
        >
          <Calendar className="h-5 w-5 mb-1" />
          <span className="text-sm">New Task</span>
        </Button>
        
        <Button
          variant="outline"
          className="flex flex-col items-center py-4 h-auto"
        >
          <Calendar className="h-5 w-5 mb-1" />
          <span className="text-sm">Calendar</span>
        </Button>
        
        <Button
          variant="outline"
          className="flex flex-col items-center py-4 h-auto"
        >
          <Focus className="h-5 w-5 mb-1" />
          <span className="text-sm">Focus Mode</span>
        </Button>
        
        <Button
          variant="outline"
          className="flex flex-col items-center py-4 h-auto"
        >
          <BarChart3 className="h-5 w-5 mb-1" />
          <span className="text-sm">Reports</span>
        </Button>
      </div>
    </div>
  );
};

export default SimplifiedQuickActions;
