
import React, { useState, useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import CreateTaskDialogEnhanced from '@/components/CreateTaskDialogEnhanced';
import { useNavigate } from 'react-router-dom';
import ProjectsPageHeader from './projects/ProjectsPageHeader';
import ProjectsSearchSection from './projects/ProjectsSearchSection';
import ProjectsGridSection from './projects/ProjectsGridSection';
import ProjectsLoadingState from './projects/ProjectsLoadingState';
import ProjectsPageBackground from './projects/ProjectsPageBackground';
import ProjectsActionToolbar from './projects/ProjectsActionToolbar';
import { useProjectsPageState } from './projects/hooks/useProjectsPageState';
import { useDebounce } from '@/utils/performanceUtils';

const ProjectsPage = () => {
  const { user } = useAuth();
  const { projects, isLoading, refetch } = useProjects();
  const { users: allUsers } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const navigate = useNavigate();

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

  if (isLoading) {
    return <ProjectsLoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
      <ProjectsPageBackground />

      <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-8 space-y-6 relative z-10">
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

        {/* Enhanced Main Content Area */}
        <div className="animate-fade-in delay-300">
          <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-3xl shadow-2xl shadow-primary/5 overflow-hidden">
            <ProjectsGridSection
              projects={searchFilteredProjects}
              searchQuery={searchQuery}
              onCreateProject={handleCreateProject}
              onViewTasks={handleViewTasks}
              onCreateTask={handleCreateTask}
              onProjectDeleted={refetch}
            />
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
  );
};

export default ProjectsPage;
