
import { useMemo } from 'react';
import { useTask } from '@/contexts/task';
import { useProjectAccess } from './hooks/useProjectAccess';
import { useProjectTasksFilters } from './hooks/useProjectTasksFilters';
import { useProjectTasksActions } from './hooks/useProjectTasksActions';

export const useProjectTasksView = (projectId: string | null) => {
  const { projects, tasks, updateTaskStatus } = useTask();

  // Get project tasks
  const projectTasks = useMemo(() => {
    if (!projectId) return [];
    return tasks.filter(task => task.projectId === projectId);
  }, [tasks, projectId]);

  // Use the separated hooks
  const { project, isLoading, loadError } = useProjectAccess(projectId, projects, tasks);
  
  const {
    searchQuery,
    sortBy,
    todoTasks,
    inProgressTasks,
    pendingTasks,
    completedTasks,
    progress,
    handleSearchChange,
    onSortByChange
  } = useProjectTasksFilters(projectTasks);

  // Wrap updateTaskStatus to ensure it returns a Promise
  const wrappedUpdateTaskStatus = async (taskId: string, status: any): Promise<void> => {
    const result = updateTaskStatus(taskId, status);
    if (result instanceof Promise) {
      await result;
    }
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
    handleTaskStatusChange,
    onSortByChange,
    handleTaskDialogComplete
  };
};
