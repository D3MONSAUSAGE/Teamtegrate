
import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectTasksView from '@/components/task/ProjectTasksView';

const ProjectTasksPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  
  return (
    <div className="h-full">
      <ProjectTasksView projectId={projectId} />
    </div>
  );
};

export default ProjectTasksPage;
