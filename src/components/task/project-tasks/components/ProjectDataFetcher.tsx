
import React from 'react';

interface ProjectDataFetcherProps {
  isLoadingProject: boolean;
  project: any;
  children: React.ReactNode;
}

const ProjectDataFetcher: React.FC<ProjectDataFetcherProps> = ({
  isLoadingProject,
  project,
  children
}) => {
  if (isLoadingProject || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProjectDataFetcher;
