
import React from 'react';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import CreateTaskDialogWithAI from '@/components/CreateTaskDialogWithAI';
import ProjectsHeader from '@/components/projects/ProjectsHeader';
import ProjectsFilters from '@/components/projects/ProjectsFilters';
import ProjectsGrid from '@/components/projects/ProjectsGrid';
import useProjectsPageData from '@/hooks/projects/useProjectsPageData';

const ProjectsPage = () => {
  const {
    projects,
    filteredProjects,
    isLoading,
    showCreateDialog,
    setShowCreateDialog,
    showCreateTaskDialog,
    setShowCreateTaskDialog,
    selectedProjectId,
    searchQuery,
    statusFilter,
    tagFilter,
    allTags,
    handleViewTasks,
    handleCreateTask,
    handleProjectDeleted,
    handleCreateSuccess,
    handleSearchChange,
    handleStatusFilterChange,
    handleTagFilterChange,
  } = useProjectsPageData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <ProjectsHeader onCreateProject={() => setShowCreateDialog(true)} />

      <ProjectsFilters
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        tagFilter={tagFilter}
        allTags={allTags}
        onSearchChange={handleSearchChange}
        onStatusFilterChange={handleStatusFilterChange}
        onTagFilterChange={handleTagFilterChange}
      />

      <ProjectsGrid
        projects={projects}
        filteredProjects={filteredProjects}
        onViewTasks={handleViewTasks}
        onCreateTask={handleCreateTask}
        onCreateProject={() => setShowCreateDialog(true)}
        onProjectDeleted={handleProjectDeleted}
      />

      <CreateProjectDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      <CreateTaskDialogWithAI
        open={showCreateTaskDialog}
        onOpenChange={setShowCreateTaskDialog}
        editingTask={undefined}
        currentProjectId={selectedProjectId}
      />
    </div>
  );
};

export default ProjectsPage;
