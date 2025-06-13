
import React, { useEffect } from 'react';
import { Task, TaskStatus } from '@/types';
import CreateTaskDialogEnhanced from '../CreateTaskDialogEnhanced';
import ProjectTasksContent from './project-view/ProjectTasksContent';
import { useProjectTasksView } from './project-view/useProjectTasksView';
import ProjectTasksLoading from './project-view/ProjectTasksLoading';
import ProjectTasksError from './project-view/ProjectTasksError';

interface ProjectTasksViewProps {
  projectId: string | undefined;
}

const ProjectTasksView: React.FC<ProjectTasksViewProps> = ({ projectId }) => {
  console.log('ProjectTasksView: Rendering with projectId:', projectId);

  // Add error boundary for the hook
  let hookData;
  try {
    hookData = useProjectTasksView(projectId || null);
  } catch (error) {
    console.error('ProjectTasksView: Error in useProjectTasksView hook:', error);
    return (
      <ProjectTasksError 
        errorMessage="Failed to load project tasks data"
        onRefresh={() => window.location.reload()}
        isRefreshing={false}
      />
    );
  }

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
  } = hookData;

  // Log component rendering for debugging
  useEffect(() => {
    console.log("ProjectTasksView rendering", {
      projectId,
      isLoading,
      hasError: !!loadError,
      hasProject: !!project,
      editingTask,
      todoTasksCount: todoTasks?.length || 0,
      inProgressTasksCount: inProgressTasks?.length || 0,
      completedTasksCount: completedTasks?.length || 0,
      teamMembersCount: teamMembers?.length || 0,
      isLoadingTeamMembers,
      teamMembersError
    });
  }, [projectId, isLoading, loadError, project, editingTask, todoTasks, inProgressTasks, completedTasks, teamMembers, isLoadingTeamMembers, teamMembersError]);

  if (isLoading) {
    console.log('ProjectTasksView: Showing loading state');
    return <ProjectTasksLoading />;
  }
  
  if (loadError || !project) {
    console.log('ProjectTasksView: Showing error state:', loadError);
    return (
      <ProjectTasksError 
        errorMessage={loadError || "Project not found or not accessible."}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />
    );
  }

  // Create a wrapper function to convert the event to a string
  const handleSearchQueryChange = (query: string) => {
    console.log('ProjectTasksView: Search query changed to:', query);
    // handleSearchChange expects a ChangeEvent, so we need to create a mock event
    const mockEvent = {
      target: { value: query }
    } as React.ChangeEvent<HTMLInputElement>;
    handleSearchChange(mockEvent);
  };

  // Explicitly type the task status change handler to ensure Promise<void>
  const handleTaskStatusChangeAsync = async (taskId: string, status: TaskStatus): Promise<void> => {
    return await handleTaskStatusChange(taskId, status);
  };

  console.log('ProjectTasksView: Rendering content with project:', project.title);

  return (
    <>
      <ProjectTasksContent
        project={project}
        progress={progress}
        todoTasks={todoTasks || []}
        inProgressTasks={inProgressTasks || []}
        completedTasks={completedTasks || []}
        teamMembers={teamMembers || []}
        isLoadingTeamMembers={isLoadingTeamMembers}
        searchQuery={searchQuery || ''}
        sortBy={sortBy || 'deadline'}
        onSearchChange={handleSearchQueryChange}
        onSortByChange={onSortByChange}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        onEditTask={handleEditTask}
        onCreateTask={handleCreateTask}
        onTaskStatusChange={handleTaskStatusChangeAsync}
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
