
import React, { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import CreateTaskDialogEnhanced from '@/components/CreateTaskDialogEnhanced';
import { useNavigate } from 'react-router-dom';
import ProjectsPageHeader from './projects/ProjectsPageHeader';
import ProjectsSearchSection from './projects/ProjectsSearchSection';
import ProjectsGridSection from './projects/ProjectsGridSection';
import ProjectsLoadingState from './projects/ProjectsLoadingState';
import ProjectsPageBackground from './projects/ProjectsPageBackground';

const ProjectsPage = () => {
  console.log('ProjectsPage: Component rendering');
  
  const { user } = useAuth();
  const { projects, isLoading, refetch } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const navigate = useNavigate();

  console.log('ProjectsPage: State values:', {
    projectsCount: projects?.length || 0,
    isLoading,
    searchQuery,
    isCreateDialogOpen,
    isCreateTaskOpen,
    selectedProjectId,
    user: !!user
  });

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log('ProjectsPage: Filtered projects count:', filteredProjects.length);

  const handleViewTasks = (projectId: string) => {
    console.log('ProjectsPage: handleViewTasks called for project:', projectId);
    try {
      const targetUrl = `/dashboard/projects/${projectId}/tasks`;
      console.log('ProjectsPage: Navigating to:', targetUrl);
      navigate(targetUrl);
      console.log('ProjectsPage: Navigation initiated successfully');
    } catch (error) {
      console.error('ProjectsPage: Navigation error:', error);
    }
  };

  const handleCreateTask = (projectId: string) => {
    console.log('ProjectsPage: handleCreateTask called for project:', projectId);
    try {
      setSelectedProjectId(projectId);
      setIsCreateTaskOpen(true);
      console.log('ProjectsPage: Task dialog state updated');
    } catch (error) {
      console.error('ProjectsPage: Error opening task dialog:', error);
    }
  };

  const handleProjectCreated = () => {
    console.log('ProjectsPage: Project created, refreshing list...');
    refetch();
  };

  const handleTaskCreated = () => {
    console.log('ProjectsPage: Task created, closing dialog...');
    setIsCreateTaskOpen(false);
    setSelectedProjectId(undefined);
  };

  const handleCreateProject = () => {
    console.log('ProjectsPage: Create project button clicked');
    setIsCreateDialogOpen(true);
  };

  if (isLoading) {
    console.log('ProjectsPage: Showing loading state');
    return <ProjectsLoadingState />;
  }

  console.log('ProjectsPage: Rendering main content');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
      <ProjectsPageBackground />

      <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-8 space-y-10 relative z-10">
        {/* Enhanced Page Header */}
        <div className="animate-fade-in">
          <ProjectsPageHeader onCreateProject={handleCreateProject} />
        </div>
        
        {/* Enhanced Search Section */}
        <div className="animate-fade-in delay-200">
          <ProjectsSearchSection
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            resultsCount={filteredProjects.length}
          />
        </div>

        {/* Enhanced Main Content Area */}
        <div className="animate-fade-in delay-300">
          <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-3xl shadow-2xl shadow-primary/5 overflow-hidden">
            <ProjectsGridSection
              projects={filteredProjects}
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
