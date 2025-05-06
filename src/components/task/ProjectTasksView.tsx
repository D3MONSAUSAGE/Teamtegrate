
import React, { useEffect } from 'react';
import { Task } from '@/types';
import CreateTaskDialogWithAI from '../CreateTaskDialogWithAI';
import ProjectTasksContent from './project-view/ProjectTasksContent';
import { useProjectTasksView } from './project-view/useProjectTasksView';
import ProjectTasksLoading from './project-view/ProjectTasksLoading';
import ProjectTasksError from './project-view/ProjectTasksError';

interface ProjectTasksViewProps {
  projectId: string | undefined;
}

const ProjectTasksView: React.FC<ProjectTasksViewProps> = ({ projectId }) => {
  const {
    isLoading,
    loadError,
    project,
    searchQuery,
    sortBy,
    todoTasks,
    inProgressTasks,
    pendingTasks,
    completedTasks,
    progress,
    isRefreshing,
    isCreateTaskOpen,
    editingTask,
    setIsCreateTaskOpen,
    handleSearchChange,
    handleEditTask,
    handleCreateTask,
    handleManualRefresh,
    onSortByChange,
    refreshData
  } = useProjectTasksView(projectId);

  // Log component rendering for debugging
  useEffect(() => {
    console.log("ProjectTasksView rendering", {
      projectId,
      isLoading,
      hasError: !!loadError,
      hasProject: !!project,
      taskCounts: {
        todo: todoTasks.length,
        inProgress: inProgressTasks.length,
        pending: pendingTasks.length,
        completed: completedTasks.length
      }
    });
  }, [projectId, isLoading, loadError, project, todoTasks, inProgressTasks, pendingTasks, completedTasks]);

  // Force refresh when first loaded or projectId changes
  useEffect(() => {
    if (projectId && !isLoading && !loadError) {
      console.log(`ProjectTasksView: Refreshing data for project ${projectId}`);
      refreshData();
    }
  }, [projectId, refreshData]);

  if (isLoading) {
    return <ProjectTasksLoading />;
  }
  
  if (loadError || !project) {
    return (
      <ProjectTasksError 
        errorMessage={loadError || "Project not found or not accessible."}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />
    );
  }

  return (
    <>
      <ProjectTasksContent
        project={project}
        progress={progress}
        todoTasks={todoTasks}
        inProgressTasks={inProgressTasks}
        pendingTasks={pendingTasks}
        completedTasks={completedTasks}
        searchQuery={searchQuery}
        sortBy={sortBy}
        onSearchChange={handleSearchChange}
        onSortByChange={onSortByChange}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        onEditTask={handleEditTask}
        onCreateTask={handleCreateTask}
      />
      
      <CreateTaskDialogWithAI
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={projectId ?? undefined}
      />
    </>
  );
};

export default ProjectTasksView;
