
import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus } from '@/types';
import { useTask } from '@/contexts/task';
import { useProjects } from '@/hooks/useProjects';
import { useProjectTasks } from './useProjectTasks';
import { toast } from '@/components/ui/sonner';

export const useProjectTasksView = (projectId: string | null) => {
  const { tasks, updateTaskStatus } = useTask();
  const { projects, isLoading, refreshProjects } = useProjects();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  // Find the current project
  const project = projects.find(p => p.id === projectId);

  // Get project-specific tasks
  const projectTasks = tasks.filter(task => task.project_id === projectId);

  // Use the project tasks hook
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    todoTasks,
    inProgressTasks,
    pendingTasks,
    completedTasks,
    progress
  } = useProjectTasks(projectTasks, projectId);

  // Check if project is accessible
  useEffect(() => {
    if (!isLoading && projectId && !project) {
      setLoadError("Project not found or not accessible.");
    } else {
      setLoadError(null);
    }
  }, [isLoading, projectId, project]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  }, []);

  const handleCreateTask = useCallback(() => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  }, []);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshProjects();
      toast.success('Projects refreshed successfully');
    } catch (error) {
      console.error('Error refreshing projects:', error);
      toast.error('Failed to refresh projects');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshProjects]);

  const handleTaskStatusChange = useCallback((taskId: string, status: TaskStatus) => {
    try {
      console.log(`ProjectTasksView: Changing task ${taskId} status to ${status}`);
      updateTaskStatus(taskId, status);
      
      // Show success message based on status
      const statusMessages = {
        'To Do': 'Task moved to To Do',
        'In Progress': 'Task moved to In Progress', 
        'Pending': 'Task moved to Pending',
        'Done': 'Task completed successfully!'
      };
      
      toast.success(statusMessages[status] || 'Task status updated');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  }, [updateTaskStatus]);

  const onSortByChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
  }, [setSortBy]);

  const handleTaskDialogComplete = useCallback(() => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(false);
  }, []);

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
