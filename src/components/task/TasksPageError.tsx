
import React from 'react';

interface TasksPageErrorProps {
  error: Error;
}

const TasksPageError = ({ error }: TasksPageErrorProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading tasks</p>
          <p className="text-muted-foreground text-sm">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
};

export default TasksPageError;
