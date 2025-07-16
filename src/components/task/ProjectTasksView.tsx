
import React from 'react';
import { useProjectTasksView } from './project-view/useProjectTasksView';
import ProjectTasksContent from './project-view/ProjectTasksContent';
import EnhancedCreateTaskDialog from './EnhancedCreateTaskDialog';

interface ProjectTasksViewProps {
  projectId: string | undefined;
}

const ProjectTasksView: React.FC<ProjectTasksViewProps> = ({ projectId }) => {
  console.log('ProjectTasksView: Rendering with projectId:', projectId);

  const {
    project,
    isLoading,
    loadError,
    todoTasks,
    inProgressTasks,
    completedTasks,
    progress,
    teamMembers,
    isLoadingTeamMembers,
    searchQuery,
    sortBy,
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
  } = useProjectTasksView(projectId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading project...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error loading project: {loadError.message}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Project not found</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ProjectTasksContent
        project={project}
        searchQuery={searchQuery}
        sortBy={sortBy}
        todoTasks={todoTasks}
        inProgressTasks={inProgressTasks}
        completedTasks={completedTasks}
        progress={progress}
        teamMembers={teamMembers}
        isLoadingTeamMembers={isLoadingTeamMembers}
        onSearchChange={handleSearchChange}
        onSortByChange={onSortByChange}
        onCreateTask={handleCreateTask}
        onEditTask={handleEditTask}
        onTaskStatusChange={handleTaskStatusChange}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      <EnhancedCreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={projectId}
        onTaskComplete={handleTaskDialogComplete}
      />
    </div>
  );
};

export default ProjectTasksView;
