
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      <div className="flex flex-col items-center justify-center h-64 space-y-6 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-lg p-8">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Unable to load project</h2>
          <p className="text-red-600 dark:text-red-400 mb-4">{errorMessage || "An unknown error occurred"}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            This might be due to network issues or the project may no longer exist.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={onRefresh} 
            disabled={isRefreshing}
            className="flex items-center"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? "Refreshing..." : "Try Again"}
          </Button>
          
          <Button variant="outline" asChild>
            <Link to="/dashboard/projects" className="flex items-center">
              <Home className="mr-2 h-4 w-4" />
              Return to Projects
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectTasksError;
