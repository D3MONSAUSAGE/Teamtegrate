
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CleanDashboardHeaderProps {
  userName: string;
  onCreateTask: () => void;
}

const CleanDashboardHeader: React.FC<CleanDashboardHeaderProps> = ({ 
  userName, 
  onCreateTask 
}) => {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Good morning, {userName}
        </h1>
        <p className="text-muted-foreground text-lg">
          {today}
        </p>
      </div>
      <Button 
        onClick={onCreateTask}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 h-auto"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create New Task
      </Button>
    </div>
  );
};

export default CleanDashboardHeader;
