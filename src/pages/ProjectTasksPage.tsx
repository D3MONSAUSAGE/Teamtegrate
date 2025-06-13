
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ProjectTasksView from '@/components/task/ProjectTasksView';
import { useAuth } from '@/contexts/AuthContext';

const ProjectTasksPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading } = useAuth();
  
  console.log('ProjectTasksPage: Rendering with projectId:', projectId);
  console.log('ProjectTasksPage: User:', user?.id, 'Loading:', loading);
  
  if (loading) {
    console.log('ProjectTasksPage: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    console.log('ProjectTasksPage: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!projectId) {
    console.log('ProjectTasksPage: No projectId, redirecting to projects');
    return <Navigate to="/dashboard/projects" replace />;
  }

  console.log('ProjectTasksPage: Rendering ProjectTasksView with projectId:', projectId);
  
  return (
    <div className="h-full">
      <ProjectTasksView projectId={projectId} />
    </div>
  );
};

export default ProjectTasksPage;
