
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task } from '@/types';
import CreateTaskDialog from '../CreateTaskDialog';
import ProjectTasksLoading from './project-view/ProjectTasksLoading';
import ProjectTasksError from './project-view/ProjectTasksError';
import ProjectTasksContent from './project-view/ProjectTasksContent';
import { useProjectTasksView } from './project-view/useProjectTasksView';
import { Skeleton } from '@/components/ui/skeleton';

const ProjectTasksView = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  
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
    onSortByChange
  } = useProjectTasksView(projectId);

  // Log component rendering for debugging
  useEffect(() => {
    console.log("ProjectTasksView rendering", {
      projectId,
      isLoading,
      hasProject: !!project,
      hasError: !!loadError
    });
  }, [projectId, isLoading, project, loadError]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <Skeleton className="h-16 w-full mb-4" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <ProjectTasksLoading />
      </div>
    );
  }
  
  if (loadError) {
    return (
      <ProjectTasksError 
        errorMessage={loadError}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />
    );
  }

  if (!project) {
    return (
      <ProjectTasksError 
        errorMessage="Project not found or not accessible."
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
      
      <CreateTaskDialog
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={projectId ?? undefined}
      />
    </>
  );
};

export default ProjectTasksView;
