
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ProjectTasksView from '@/components/task/ProjectTasksView';
import { useAuth } from '@/contexts/AuthContext';

const ProjectTasksPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!projectId) {
    return <Navigate to="/dashboard/projects" replace />;
  }
  
  return (
    <div className="h-full">
      <ProjectTasksView projectId={projectId} />
    </div>
  );
};

export default ProjectTasksPage;
