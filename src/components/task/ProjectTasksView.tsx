
import React, { useEffect } from 'react';
import { Task } from '@/types';
import CreateTaskDialogEnhanced from '../CreateTaskDialogEnhanced';
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
    completedTasks,
    progress,
    teamMembers,
    isLoadingTeamMembers,
    teamMembersError,
    isRefreshing,
    isCreateTaskOpen,
    editingTask,
    setIsCreateTaskOpen,
    handleSearchChange,
    handleEditTask,
    handleCreateTask,
    handleManualRefresh,
    handleTaskStatusChange,
    onSortByChange,
    handleTaskDialogComplete
  } = useProjectTasksView(projectId || null);

  // Log component rendering for debugging
  useEffect(() => {
    console.log("ProjectTasksView rendering", {
      projectId,
      isLoading,
      hasError: !!loadError,
      hasProject: !!project,
      editingTask,
      todoTasksCount: todoTasks.length,
      inProgressTasksCount: inProgressTasks.length,
      completedTasksCount: completedTasks.length,
      teamMembersCount: teamMembers.length,
      isLoadingTeamMembers,
      teamMembersError
    });
  }, [projectId, isLoading, loadError, project, editingTask, todoTasks, inProgressTasks, completedTasks, teamMembers, isLoadingTeamMembers, teamMembersError]);

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
        completedTasks={completedTasks}
        teamMembers={teamMembers}
        isLoadingTeamMembers={isLoadingTeamMembers}
        searchQuery={searchQuery}
        sortBy={sortBy}
        onSearchChange={handleSearchChange}
        onSortByChange={onSortByChange}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        onEditTask={handleEditTask}
        onCreateTask={handleCreateTask}
        onTaskStatusChange={handleTaskStatusChange}
      />
      
      <CreateTaskDialogEnhanced
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={projectId ?? undefined}
        onTaskComplete={handleTaskDialogComplete}
      />
    </>
  );
};

export default ProjectTasksView;
