
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ProjectTasksView from '@/components/task/ProjectTasksView';
import { useAuth } from '@/contexts/AuthContext';

const ProjectTasksPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading, isAuthenticated } = useAuth();
  
  console.log('ProjectTasksPage: Starting render', {
    projectId,
    userId: user?.id,
    loading,
    isAuthenticated,
    timestamp: new Date().toISOString()
  });
  
  // Enhanced loading state with timeout protection
  if (loading) {
    console.log('ProjectTasksPage: Auth loading, showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="text-muted-foreground">Loading project...</div>
        </div>
      </div>
    );
  }

  // Enhanced authentication check
  if (!isAuthenticated || !user) {
    console.log('ProjectTasksPage: User not authenticated, redirecting to login', {
      isAuthenticated,
      hasUser: !!user
    });
    return <Navigate to="/login" replace />;
  }

  // Enhanced project ID validation
  if (!projectId || projectId.trim() === '') {
    console.log('ProjectTasksPage: Invalid or missing projectId, redirecting to projects', {
      projectId,
      projectIdTrimmed: projectId?.trim()
    });
    return <Navigate to="/dashboard/projects" replace />;
  }

  console.log('ProjectTasksPage: All checks passed, rendering ProjectTasksView', {
    projectId,
    userId: user.id,
    userRole: user.role
  });
  
  return (
    <div className="h-full">
      <ProjectTasksView projectId={projectId} />
    </div>
  );
};

export default ProjectTasksPage;
