
import React from 'react';
import { useProjectsPage } from '@/hooks/useProjectsPage';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import AssignTaskDialog from '@/components/AssignTaskDialog';
import ProjectToolbar from '@/components/ProjectToolbar';
import ProjectList from '@/components/ProjectList';
import ProjectTasksDialog from '@/components/ProjectTasksDialog';
import { ProjectsLoading } from '@/components/project/ProjectsLoading';
import { ProjectsError } from '@/components/project/ProjectsError';
import { useTask } from '@/contexts/task';

const ProjectsPage = () => {
  const { fetchProjects } = useTask();
  const {
    sortedProjects,
    pageLoading,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    isCreateProjectOpen,
    editingProject,
    selectedProject,
    isViewTasksOpen,
    isCreateTaskOpen,
    editingTask,
    selectedTask,
    isAssignTaskOpen,
    handleEditProject,
    handleViewTasks,
    handleCreateTask,
    handleEditTask,
    handleAssignTask,
    handleCreateProject,
    handleTaskDialogChange,
    handleProjectDialogChange,
    setIsViewTasksOpen,
    setIsAssignTaskOpen,
  } = useProjectsPage();

  if (pageLoading || isLoading) {
    return <ProjectsLoading />;
  }

  if (error) {
    return (
      <ProjectsError 
        error={error}
        onRetry={() => {
          if (fetchProjects) fetchProjects();
        }}
      />
    );
  }

  return (
    <div className="p-6">
      <ProjectToolbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onCreateProject={handleCreateProject}
      />
      
      <ProjectList 
        projects={sortedProjects}
        searchQuery={searchQuery}
        onEditProject={handleEditProject}
        onViewTasks={handleViewTasks}
        onCreateProject={handleCreateProject}
        onCreateTask={handleCreateTask}
      />
      
      <CreateProjectDialog 
        open={isCreateProjectOpen} 
        onOpenChange={handleProjectDialogChange}
        editingProject={editingProject}
      />
      
      <ProjectTasksDialog 
        open={isViewTasksOpen}
        onOpenChange={setIsViewTasksOpen}
        project={selectedProject}
        onCreateTask={() => handleCreateTask(selectedProject)}
        onEditTask={handleEditTask}
        onAssignTask={handleAssignTask}
      />
      
      <CreateTaskDialog 
        open={isCreateTaskOpen} 
        onOpenChange={handleTaskDialogChange}
        editingTask={editingTask}
        currentProjectId={selectedProject?.id}
      />
      
      {selectedTask && (
        <AssignTaskDialog 
          open={isAssignTaskOpen} 
          onOpenChange={setIsAssignTaskOpen}
          task={selectedTask}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
