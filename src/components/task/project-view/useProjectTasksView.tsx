
import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus } from '@/types';
import { useProjectAccess } from './hooks/useProjectAccess';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useProjectTeamMembers } from '@/hooks/useProjectTeamMembers';
import { useProjectTasksActions } from './hooks/useProjectTasksActions';

export function useProjectTasksView(projectId: string | null) {
  console.log('useProjectTasksView: Hook called with projectId:', projectId);
  
  // Project access with proper loading handling
  const { project, isLoading: projectLoading, loadError: projectError } = useProjectAccess(projectId);
  
  // Tasks data - using the correct hook
  const { 
    tasks, 
    isLoading: tasksLoading, 
    error: tasksError, 
    refetch: refetchTasks 
  } = useProjectTasks(projectId);
  
  // Team members data
  const { 
    teamMembers, 
    isLoading: isLoadingTeamMembers, 
    error: teamMembersError, 
    refetch: refetchTeamMembers 
  } = useProjectTeamMembers(projectId || '');

  // Data refresh function for actions hook
  const onDataRefresh = useCallback(async () => {
    await Promise.all([
      refetchTasks(),
      refetchTeamMembers()
    ]);
  }, [refetchTasks, refetchTeamMembers]);

  // Use the actions hook to get properly implemented handlers
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
  } = useProjectTasksActions({ onDataRefresh });

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('deadline');

  // Derived state
  const isLoading = projectLoading || tasksLoading;
  const loadError = projectError || tasksError;

  // Filter and organize tasks
  const filteredTasks = tasks?.filter(task => {
    if (!searchQuery) return true;
    return task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           task.description?.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  const todoTasks = filteredTasks.filter(task => task.status === 'To Do');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'In Progress');
  const completedTasks = filteredTasks.filter(task => task.status === 'Completed');

  // Calculate progress
  const totalTasks = filteredTasks.length;
  const completedCount = completedTasks.length;
  const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // Event handlers
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const onSortByChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('useProjectTasksView: State update', {
      projectId,
      hasProject: !!project,
      projectLoading,
      projectError,
      tasksCount: tasks?.length || 0,
      tasksLoading,
      tasksError,
      teamMembersCount: teamMembers?.length || 0,
      isLoadingTeamMembers,
      teamMembersError
    });
  }, [project, projectLoading, projectError, tasks, tasksLoading, tasksError, teamMembers, isLoadingTeamMembers, teamMembersError, projectId]);

  return {
    // Project data
    project,
    isLoading,
    loadError,
    
    // Tasks data
    tasks: filteredTasks,
    todoTasks,
    inProgressTasks,
    completedTasks,
    progress,
    
    // Team data
    teamMembers,
    isLoadingTeamMembers,
    teamMembersError,
    
    // UI state from actions hook
    searchQuery,
    sortBy,
    isRefreshing,
    isCreateTaskOpen,
    editingTask,
    setIsCreateTaskOpen,
    
    // Event handlers
    handleSearchChange,
    handleEditTask,
    handleCreateTask,
    handleManualRefresh,
    handleTaskStatusChange, // Now properly implemented
    onSortByChange,
    handleTaskDialogComplete
  };
}
