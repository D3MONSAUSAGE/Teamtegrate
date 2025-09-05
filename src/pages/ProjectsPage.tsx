import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import EnhancedCreateTaskDialog from '@/components/task/EnhancedCreateTaskDialog';
import { useNavigate } from 'react-router-dom';
import ProjectsPageHeader from './projects/ProjectsPageHeader';
import ProjectsPageBackground from './projects/ProjectsPageBackground';
import ProjectTabs from '@/components/project/ProjectTabs';
import { useDebounce } from '@/utils/performanceUtils';
import { useResilientProjects } from '@/hooks/useResilientProjects';
import ProjectsErrorBoundary from '@/components/ErrorBoundary/ProjectsErrorBoundary';
import ProjectsSkeletonGrid from '@/components/projects/ProjectsSkeletonGrid';
import ProjectsStatusIndicator from '@/components/projects/ProjectsStatusIndicator';
import ConnectionStatus from '@/components/dashboard/ConnectionStatus';
import { useTask } from '@/contexts/task';
import { Project } from '@/types';

const ProjectsPage = () => {
  const { user } = useAuth();
  const { users: allUsers } = useUsers();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const navigate = useNavigate();

  // Get task functions from context
  const { createTask, updateTask } = useTask();

  // Use resilient projects hook for better error handling and caching
  const {
    projects,
    isLoading,
    error,
    isShowingCached,
    isStale,
    lastSuccessfulFetch,
    retryCount,
    maxRetries,
    refetch,
    createProject: resilientCreateProject,
    deleteProject: resilientDeleteProject
  } = useResilientProjects();

  // Categorize projects by status
  const { todoProjects, inProgressProjects, completedProjects } = useMemo(() => {
    const todo: Project[] = [];
    const inProgress: Project[] = [];
    const completed: Project[] = [];

    // Guard against undefined or null projects
    if (Array.isArray(projects)) {
      projects.forEach(project => {
        if (project.status === 'Completed' || project.isCompleted) {
          completed.push(project);
        } else if (project.status === 'In Progress') {
          inProgress.push(project);
        } else {
          todo.push(project);
        }
      });
    }

    return {
      todoProjects: todo,
      inProgressProjects: inProgress,
      completedProjects: completed
    };
  }, [projects]);

  // Debounced navigation to prevent rapid clicking
  const debouncedNavigate = useDebounce((path: string) => {
    navigate(path);
  }, 200);

  const debouncedCreateTask = useDebounce((projectId: string) => {
    setSelectedProjectId(projectId);
    setIsCreateTaskOpen(true);
  }, 200);

  // Memoized handlers
  const handleViewTasks = useMemo(() => (projectId: string) => {
    try {
      const targetUrl = `/dashboard/projects/${projectId}/tasks`;
      debouncedNavigate(targetUrl);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('ProjectsPage: Navigation error:', error);
      }
    }
  }, [debouncedNavigate]);

  const handleCreateTask = useMemo(() => (projectId: string) => {
    try {
      debouncedCreateTask(projectId);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('ProjectsPage: Error opening task dialog:', error);
      }
    }
  }, [debouncedCreateTask]);

  const handleProjectCreated = useMemo(() => () => {
    refetch();
  }, [refetch]);

  const handleTaskCreated = useMemo(() => () => {
    setIsCreateTaskOpen(false);
    setSelectedProjectId(undefined);
  }, []);

  const handleCreateProject = useMemo(() => () => {
    setIsCreateDialogOpen(true);
  }, []);

  const handleRetry = useMemo(() => () => {
    refetch();
  }, [refetch]);

  const handleProjectDeleted = useMemo(() => () => {
    refetch();
  }, [refetch]);

  return (
    <ProjectsErrorBoundary onRetry={handleRetry}>
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
        <ProjectsPageBackground />

        <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-8 space-y-6 relative z-10">
          {/* Connection Status */}
          {(error || isShowingCached) && (
            <div className="animate-fade-in">
              <ConnectionStatus 
                lastError={error} 
                onRetry={handleRetry}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Page Header */}
          <div className="animate-fade-in">
            <ProjectsPageHeader
              totalProjects={projects.length}
              todoCount={todoProjects.length}
              inProgressCount={inProgressProjects.length}
              completedCount={completedProjects.length}
              onCreateProject={handleCreateProject}
            />
          </div>

          {/* Status Indicator for cached/stale data */}
          <ProjectsStatusIndicator
            isShowingCached={isShowingCached}
            isStale={isStale}
            lastSuccessfulFetch={lastSuccessfulFetch}
            onRefresh={handleRetry}
            isLoading={isLoading}
          />

          {/* Enhanced Main Content Area */}
          <div className="animate-fade-in delay-300">
            <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-3xl shadow-2xl shadow-primary/5 overflow-hidden">
              {isLoading && !isShowingCached ? (
                <div className="p-6">
                  <ProjectsSkeletonGrid count={6} showHeader={false} />
                </div>
              ) : (
                <ProjectTabs
                  todoProjects={todoProjects}
                  inProgressProjects={inProgressProjects}
                  completedProjects={completedProjects}
                  onViewTasks={handleViewTasks}
                  onCreateTask={handleCreateTask}
                  onProjectDeleted={handleProjectDeleted}
                  onCreateProject={handleCreateProject}
                />
              )}
            </div>
          </div>
        </div>

        <CreateProjectDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onProjectCreated={handleProjectCreated}
        />

        <EnhancedCreateTaskDialog
          open={isCreateTaskOpen}
          onOpenChange={setIsCreateTaskOpen}
          currentProjectId={selectedProjectId}
          onTaskComplete={handleTaskCreated}
          createTask={createTask}
          updateTask={updateTask}
        />
      </div>
    </ProjectsErrorBoundary>
  );
};

export default ProjectsPage;
