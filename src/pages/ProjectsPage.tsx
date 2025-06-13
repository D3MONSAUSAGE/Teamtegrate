
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
  const { user } = useAuth();
  const { projects, isLoading, refetch } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const navigate = useNavigate();

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewTasks = (projectId: string) => {
    console.log('ProjectsPage: View tasks clicked for project:', projectId);
    try {
      const targetUrl = `/dashboard/projects/${projectId}/tasks`;
      console.log('ProjectsPage: Navigating to:', targetUrl);
      navigate(targetUrl);
    } catch (error) {
      console.error('ProjectsPage: Navigation error:', error);
    }
  };

  const handleCreateTask = (projectId: string) => {
    console.log('ProjectsPage: Create task clicked for project:', projectId);
    setSelectedProjectId(projectId);
    setIsCreateTaskOpen(true);
  };

  const handleProjectCreated = () => {
    console.log('Project created, refreshing list...');
    refetch();
  };

  const handleTaskCreated = () => {
    console.log('Task created, closing dialog...');
    setIsCreateTaskOpen(false);
    setSelectedProjectId(undefined);
  };

  const handleCreateProject = () => {
    console.log('ProjectsPage: Create project button clicked');
    setIsCreateDialogOpen(true);
  };

  if (isLoading) {
    return <ProjectsLoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 relative overflow-hidden">
      <ProjectsPageBackground />

      <div className="relative z-10 p-4 md:p-8 space-y-8">
        <ProjectsPageHeader onCreateProject={handleCreateProject} />
        
        <ProjectsSearchSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          resultsCount={filteredProjects.length}
        />

        <ProjectsGridSection
          projects={filteredProjects}
          searchQuery={searchQuery}
          onCreateProject={handleCreateProject}
          onViewTasks={handleViewTasks}
          onCreateTask={handleCreateTask}
          onProjectDeleted={refetch}
        />
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
