
import { useMemo } from 'react';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useProjects } from '@/hooks/useProjects';
import { useProjectAccess } from './hooks/useProjectAccess';
import { useProjectTasksFilters } from './hooks/useProjectTasksFilters';
import { useProjectTasksActions } from './hooks/useProjectTasksActions';
import { useProjectTeamMembers } from '@/hooks/useProjectTeamMembers';
import { Task } from '@/types';

export const useProjectTasksView = (projectId: string | null) => {
  console.log('useProjectTasksView: Called with projectId:', projectId);

  // Use the new project-specific tasks query instead of the "My Tasks" focused one
  const { tasks: projectTasks, isLoading: isLoadingTasks, error: tasksError, refetch: refetchTasks } = useProjectTasks(projectId);
  const { projects, refreshProjects } = useProjects();

  console.log('useProjectTasksView: Got data from hooks:', {
    tasksCount: projectTasks?.length || 0,
    projectsCount: projects?.length || 0
  });

  // Convert to Task[] - the new hook already returns the correct format
  const convertedProjectTasks = useMemo(() => {
    return projectTasks as Task[];
  }, [projectTasks]);

  // Use the separated hooks
  const { project, isLoading: isLoadingProject, loadError } = useProjectAccess(projectId, projects || []);
  
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

  // Fetch team members for the project with error handling
  const { teamMembers, isLoading: isLoadingTeamMembers, error: teamMembersError } = useProjectTeamMembers(projectId);

  // Create a comprehensive refresh function that updates both tasks and projects
  const handleDataRefresh = async () => {
    console.log('Refreshing project tasks and projects data');
    try {
      await Promise.all([
        refetchTasks(),
        refreshProjects()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
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
  } = useProjectTasksActions({ 
    onDataRefresh: handleDataRefresh
  });

  const isLoading = isLoadingProject || isLoadingTasks;
  const combinedError = loadError || (tasksError ? tasksError.message : null);

  console.log('useProjectTasksView: Returning data for PROJECT tasks (not My Tasks):', {
    isLoading,
    hasLoadError: !!combinedError,
    hasProject: !!project,
    todoTasksCount: todoTasks?.length || 0,
    inProgressTasksCount: inProgressTasks?.length || 0,
    completedTasksCount: completedTasks?.length || 0,
    teamMembersCount: teamMembers?.length || 0,
    teamMembersError: teamMembersError || null
  });

  return {
    isLoading,
    loadError: combinedError,
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
