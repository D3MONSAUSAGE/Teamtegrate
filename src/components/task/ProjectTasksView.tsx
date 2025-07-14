
import React from 'react';
import { ProjectDataFetcher, ProjectTasksContainer } from './project-tasks';
import { useProjectData } from './project-tasks/hooks/useProjectData';

interface ProjectTasksViewProps {
  projectId: string | undefined;
}

const ProjectTasksView: React.FC<ProjectTasksViewProps> = ({ projectId }) => {
  const { project, isLoadingProject } = useProjectData(projectId);

  return (
    <ProjectDataFetcher isLoadingProject={isLoadingProject} project={project}>
      <ProjectTasksContainer projectId={projectId} />
    </ProjectDataFetcher>
  );
};

export default ProjectTasksView;
