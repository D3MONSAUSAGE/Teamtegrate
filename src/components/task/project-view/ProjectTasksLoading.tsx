
import React from 'react';

const ProjectTasksLoading: React.FC = () => {
  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-center items-center h-32">
        <div className="animate-pulse text-lg">Loading project tasks...</div>
      </div>
    </div>
  );
};

export default ProjectTasksLoading;
