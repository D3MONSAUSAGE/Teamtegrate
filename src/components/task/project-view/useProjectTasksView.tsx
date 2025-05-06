import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTask } from '@/contexts/task';
import { Task, Project } from '@/types';
import { toast } from '@/components/ui/sonner';
import { useProjectTasks } from './useProjectTasks';

export const useProjectTasksView = (projectId: string | null) => {
  const { tasks, projects, refreshProjects, refreshTasks } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const refreshInProgress = useRef(false);
  
  // Memoize project data to prevent unnecessary re-renders
  const project = useMemo(() => {
    return projects.find(p => p.id === projectId);
  }, [projects, projectId]);
  
  // Use custom hook for task filtering and sorting
  const {
    searchQuery, 
    setSearchQuery,
    sortBy,
    setSortBy,
    todoTasks,
    inProgressTasks,
    pendingTasks,
    completedTasks,
    progress,
  } = useProjectTasks(tasks, projectId);

  // Reset states when project ID changes
  useEffect(() => {
    setInitialLoadComplete(false);
    setIsLoading(true);
    setLoadError(null);
    refreshInProgress.current = false;
  }, [projectId]);

  // Fetch fresh data when the component mounts or projectId changes
  useEffect(() => {
    // Skip if we've already loaded or if projectId is null
    if (initialLoadComplete || !projectId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      // Prevent duplicate fetch operations
      if (refreshInProgress.current) return;
      refreshInProgress.current = true;
      
      setIsLoading(true);
      setLoadError(null);
      
      try {
        console.log(`Loading projects data for project ID: ${projectId}`);
        await refreshTasks();
        await refreshProjects();
        console.log(`Successfully loaded projects and tasks data`);
        setInitialLoadComplete(true);
      } catch (error) {
        console.error('Error refreshing project data:', error);
        setLoadError('Failed to load project data. Please try refreshing.');
      } finally {
        setIsLoading(false);
        refreshInProgress.current = false;
      }
    };
    
    loadData();
  }, [projectId, refreshProjects, refreshTasks, initialLoadComplete]);

  // Enhanced refresh function after task update with debounce
  const refreshAfterTaskUpdate = useCallback(async () => {
    // Prevent duplicate fetches
    if (refreshInProgress.current) return;
    refreshInProgress.current = true;
    
    console.log("Refreshing tasks after task update");
    
    // Show the refreshing indicator
    setIsRefreshing(true);
    
    try {
      // First refresh tasks, then projects to ensure we have the latest data
      await refreshTasks();
      await refreshProjects();
      
      console.log("Tasks and projects refreshed successfully after update");
    } catch (error) {
      console.error("Error refreshing after task update:", error);
      toast.error("Failed to refresh latest task data");
    } finally {
      setIsRefreshing(false);
      refreshInProgress.current = false;
    }
  }, [refreshTasks, refreshProjects]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);

  const handleSortByChange = useCallback((value: string) => {
    setSortBy(value);
  }, [setSortBy]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  }, []);

  const handleCreateTask = useCallback(() => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  }, []);
  
  const handleManualRefresh = useCallback(async () => {
    if (!projectId || refreshInProgress.current) return;
    refreshInProgress.current = true;
    
    setIsRefreshing(true);
    setLoadError(null);
    
    try {
      await refreshTasks();
      await refreshProjects();
      toast.success("Project data refreshed successfully");
    } catch (error) {
      console.error('Error refreshing project data:', error);
      setLoadError('Failed to refresh project data.');
      toast.error("Failed to refresh project data");
    } finally {
      setIsRefreshing(false);
      refreshInProgress.current = false;
    }
  }, [projectId, refreshProjects, refreshTasks]);

  return {
    isLoading,
    isRefreshing,
    loadError,
    project,
    searchQuery,
    sortBy,
    todoTasks,
    inProgressTasks,
    pendingTasks,
    completedTasks,
    progress,
    isCreateTaskOpen,
    editingTask,
    setIsCreateTaskOpen,
    handleSearchChange,
    handleEditTask,
    handleCreateTask,
    handleManualRefresh,
    onSortByChange: handleSortByChange,
    refreshAfterTaskUpdate
  };
};
