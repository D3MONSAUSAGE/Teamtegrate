
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [retryCount, setRetryCount] = useState(0);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  
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
    setRetryCount(0);
    setInitialLoadAttempted(false);
    setIsLoading(true);
    setLoadError(null);
  }, [projectId]);

  // Fetch fresh data when the component mounts or projectId changes
  useEffect(() => {
    // Skip if we've already tried loading or if projectId is null
    if (initialLoadAttempted || !projectId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        console.log(`Loading projects data for project ID: ${projectId}`);
        await refreshProjects();
        await refreshTasks();
        console.log(`Successfully loaded projects and tasks data`);
        setInitialLoadAttempted(true);
      } catch (error) {
        console.error('Error refreshing project data:', error);
        setLoadError('Failed to load project data. Please try refreshing.');
        
        // Auto-retry logic (maximum 3 attempts with exponential backoff)
        if (retryCount < 3) {
          const delayMs = 1000 * Math.pow(2, retryCount);
          console.log(`Auto-retrying (attempt ${retryCount + 1}) after ${delayMs}ms...`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => loadData(), delayMs);
        } else {
          setInitialLoadAttempted(true);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [projectId, refreshProjects, refreshTasks, retryCount, initialLoadAttempted]);

  // Enhanced refresh function after task update with debounce
  const refreshAfterTaskUpdate = useCallback(async () => {
    console.log("Refreshing tasks after task update");
    
    // Show the refreshing indicator
    setIsRefreshing(true);
    
    try {
      // Add small delay to ensure database has time to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // First refresh tasks, then projects to ensure we have the latest data
      await refreshTasks();
      await refreshProjects();
      
      console.log("Tasks and projects refreshed successfully after update");
    } catch (error) {
      console.error("Error refreshing after task update:", error);
      toast.error("Failed to refresh latest task data");
    } finally {
      setIsRefreshing(false);
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
    if (!projectId) return;
    
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
