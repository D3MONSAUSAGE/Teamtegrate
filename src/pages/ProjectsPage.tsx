
import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import CreateTaskDialogEnhanced from '@/components/CreateTaskDialogEnhanced';
import { useNavigate } from 'react-router-dom';
import ProjectsPageHeader from './projects/ProjectsPageHeader';
import ProjectsSearchSection from './projects/ProjectsSearchSection';
import ProjectsGridSection from './projects/ProjectsGridSection';
import ProjectsPageBackground from './projects/ProjectsPageBackground';
import ProjectsActionToolbar from './projects/ProjectsActionToolbar';
import { useProjectsPageState } from './projects/hooks/useProjectsPageState';
import { useDebounce } from '@/utils/performanceUtils';
import { useResilientProjects } from '@/hooks/useResilientProjects';
import ProjectsErrorBoundary from '@/components/ErrorBoundary/ProjectsErrorBoundary';
import ProjectsSkeletonGrid from '@/components/projects/ProjectsSkeletonGrid';
import ProjectsStatusIndicator from '@/components/projects/ProjectsStatusIndicator';
import ConnectionStatus from '@/components/dashboard/ConnectionStatus';

const ProjectsPage = () => {
  const { user } = useAuth();
  const { users: allUsers } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const navigate = useNavigate();

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

  const {
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    statusFilter,
    setStatusFilter,
    selectedAssignee,
    handleAssigneeFilter,
    showCompleted,
    toggleCompleted,
    filteredAndSortedProjects
  } = useProjectsPageState(projects);

  // Memoized search filtering to prevent recalculation on every render
  const searchFilteredProjects = useMemo(() => 
    filteredAndSortedProjects.filter(project =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [filteredAndSortedProjects, searchQuery]
  );

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

  return (
    <ProjectsErrorBoundary onRetry={handleRetry}>
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
        <ProjectsPageBackground />

        <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-8 space-y-6 relative z-10">
          {/* Connection Status */}
          {(error || isShowingCached) && (
            <div className="animate-fade-in">
              <ConnectionStatus 
                lastError={error?.message} 
                onRetry={handleRetry}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Enhanced Action Toolbar */}
          <div className="animate-fade-in">
            <ProjectsActionToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              teamMembers={allUsers}
              selectedAssignee={selectedAssignee}
              onAssigneeFilter={handleAssigneeFilter}
              showCompleted={showCompleted}
              onToggleCompleted={toggleCompleted}
              onCreateProject={handleCreateProject}
              projectsCount={searchFilteredProjects.length}
            />
          </div>
          
          {/* Enhanced Search Section */}
          <div className="animate-fade-in delay-200">
            <ProjectsSearchSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              resultsCount={searchFilteredProjects.length}
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
                <ProjectsGridSection
                  projects={searchFilteredProjects}
                  searchQuery={searchQuery}
                  onCreateProject={handleCreateProject}
                  onViewTasks={handleViewTasks}
                  onCreateTask={handleCreateTask}
                  onProjectDeleted={resilientDeleteProject}
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

        <CreateTaskDialogEnhanced
          open={isCreateTaskOpen}
          onOpenChange={setIsCreateTaskOpen}
          currentProjectId={selectedProjectId}
          onTaskComplete={handleTaskCreated}
        />
      </div>
    </ProjectsErrorBoundary>
  );
};

export default ProjectsPage;
