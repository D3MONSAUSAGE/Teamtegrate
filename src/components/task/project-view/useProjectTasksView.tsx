
import { useMemo } from 'react';
import { useTask } from '@/contexts/task';
import { useProjects } from '@/hooks/useProjects';
import { useProjectAccess } from './hooks/useProjectAccess';
import { useProjectTasksFilters } from './hooks/useProjectTasksFilters';
import { useProjectTasksActions } from './hooks/useProjectTasksActions';
import { useProjectTeamMembers } from '@/hooks/useProjectTeamMembers';
import { Task } from '@/types';

export const useProjectTasksView = (projectId: string | null) => {
  console.log('useProjectTasksView: Called with projectId:', projectId);

  const { tasks, updateTaskStatus } = useTask();
  const { projects } = useProjects();

  console.log('useProjectTasksView: Got data from hooks:', {
    tasksCount: tasks?.length || 0,
    projectsCount: projects?.length || 0
  });

  // Get project tasks
  const projectTasks = useMemo(() => {
    if (!projectId || !tasks) {
      console.log('useProjectTasksView: No projectId or tasks, returning empty array');
      return [];
    }
    const filtered = tasks.filter(task => task.projectId === projectId);
    console.log('useProjectTasksView: Filtered tasks for project:', projectId, 'count:', filtered.length);
    return filtered;
  }, [tasks, projectId]);

  // Convert to Task[] if needed - but since we're using unified types, this should be direct
  const convertedProjectTasks = useMemo(() => {
    return projectTasks as Task[];
  }, [projectTasks]);

  // Use the separated hooks
  const { project, isLoading, loadError } = useProjectAccess(projectId, projects || []);
  
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

  // Wrap updateTaskStatus to ensure it returns a Promise - fix the TypeScript error
  const wrappedUpdateTaskStatus = async (taskId: string, status: any): Promise<void> => {
    console.log('useProjectTasksView: Updating task status:', taskId, status);
    // Convert the void return to a Promise
    const result = updateTaskStatus(taskId, status);
    // If updateTaskStatus returns a Promise, await it; otherwise return resolved Promise
    return result instanceof Promise ? result : Promise.resolve();
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

  console.log('useProjectTasksView: Returning data:', {
    isLoading,
    hasLoadError: !!loadError,
    hasProject: !!project,
    todoTasksCount: todoTasks?.length || 0,
    inProgressTasksCount: inProgressTasks?.length || 0,
    completedTasksCount: completedTasks?.length || 0,
    teamMembersCount: teamMembers?.length || 0
  });

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
    teamMembers: teamMembers || [],
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
