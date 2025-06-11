
import { useMemo } from 'react';
import { useTask } from '@/contexts/task';
import { useProjects } from '@/hooks/useProjects';
import { useProjectAccess } from './hooks/useProjectAccess';
import { useProjectTasksFilters } from './hooks/useProjectTasksFilters';
import { useProjectTasksActions } from './hooks/useProjectTasksActions';
import { useProjectTeamMembers } from '@/hooks/useProjectTeamMembers';

export const useProjectTasksView = (projectId: string | null) => {
  const { tasks, updateTaskStatus } = useTask();
  const { projects } = useProjects(); // Use unified projects from useProjects

  // Get project tasks
  const projectTasks = useMemo(() => {
    if (!projectId) return [];
    return tasks.filter(task => task.projectId === projectId);
  }, [tasks, projectId]);

  // Use the separated hooks with projects from useProjects
  const { project, isLoading, loadError } = useProjectAccess(projectId, projects);
  
  const {
    searchQuery,
    sortBy,
    todoTasks,
    inProgressTasks,
    completedTasks,
    progress,
    handleSearchChange,
    onSortByChange
  } = useProjectTasksFilters(projectTasks);

  // Fetch team members for the project
  const { teamMembers, isLoading: isLoadingTeamMembers, error: teamMembersError } = useProjectTeamMembers(projectId);

  // Wrap updateTaskStatus to ensure it returns a Promise
  const wrappedUpdateTaskStatus = async (taskId: string, status: any): Promise<void> => {
    updateTaskStatus(taskId, status);
  };

  const {
    isRefreshing,
    isCreateTaskOpen,
    editingTask,
    setIsCreateTaskOpen,
    handleEditTask,
    handleCreateTask,
    handleManualRefresh,
    handleTaskStatusChange,
    handleTaskDialogComplete
  } = useProjectTasksActions({ updateTaskStatus: wrappedUpdateTaskStatus });

  return {
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
  };
};
