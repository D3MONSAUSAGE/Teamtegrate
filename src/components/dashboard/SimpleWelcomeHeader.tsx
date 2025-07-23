
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface SimpleWelcomeHeaderProps {
  userName: string;
  onCreateTask: () => void;
}

const SimpleWelcomeHeader: React.FC<SimpleWelcomeHeaderProps> = ({ userName, onCreateTask }) => {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Good morning, {userName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {today} • Stay productive today
        </p>
      </div>
      <Button 
        onClick={onCreateTask}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create New Task
      </Button>
    </div>
  );
};

export default SimpleWelcomeHeader;
