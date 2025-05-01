
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ProjectTasksErrorProps {
  errorMessage: string | null;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

const ProjectTasksError: React.FC<ProjectTasksErrorProps> = ({ 
  errorMessage, 
  onRefresh, 
  isRefreshing 
}) => {
  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-500">{errorMessage}</p>
        <Button 
          onClick={onRefresh} 
          disabled={isRefreshing}
          className="flex items-center"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Project Data"}
        </Button>
      </div>
    </div>
  );
};

export default ProjectTasksError;
