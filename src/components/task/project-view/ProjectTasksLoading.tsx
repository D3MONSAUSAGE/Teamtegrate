
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const ProjectTasksLoading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full p-6">
      <div className="flex flex-col items-center justify-center space-y-4 mb-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="text-xl font-medium">Loading project tasks...</div>
        <p className="text-sm text-muted-foreground text-center">
          Please wait while we retrieve your project data
        </p>
      </div>
      
      <div className="w-full max-w-5xl mx-auto mt-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-md p-4">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectTasksLoading;
