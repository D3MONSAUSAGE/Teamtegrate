
import { useMemo } from 'react';
import { useTask } from '@/contexts/task';
import { useProjects } from '@/hooks/useProjects';
import { useProjectAccess } from './hooks/useProjectAccess';
import { useProjectTasksFilters } from './hooks/useProjectTasksFilters';
import { useProjectTasksActions } from './hooks/useProjectTasksActions';
import { useProjectTeamMembers } from '@/hooks/useProjectTeamMembers';
import { Task } from '@/types';

export const useProjectTasksView = (projectId: string | null) => {
  const { tasks, updateTaskStatus } = useTask();
  const { projects } = useProjects();

  // Get project tasks
  const projectTasks = useMemo(() => {
    if (!projectId) return [];
    return tasks.filter(task => task.projectId === projectId);
  }, [tasks, projectId]);

  // Convert to Task[] if needed - but since we're using unified types, this should be direct
  const convertedProjectTasks = useMemo(() => {
    return projectTasks as Task[];
  }, [projectTasks]);

  // Use the separated hooks
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
  } = useProjectTasksFilters(convertedProjectTasks);

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
