
import { useState, useCallback } from 'react';
import { Task, TaskStatus } from '@/types';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';

interface UseProjectTasksActionsProps {
  onDataRefresh?: () => Promise<void>;
}

export const useProjectTasksActions = ({ onDataRefresh }: UseProjectTasksActionsProps) => {
  const { updateTaskStatus: contextUpdateTaskStatus } = useTask();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

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
      if (onDataRefresh) {
        await onDataRefresh();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [onDataRefresh]);

  const handleTaskStatusChange = useCallback(async (taskId: string, status: TaskStatus): Promise<void> => {
    try {
      console.log('Updating task status:', { taskId, status });
      
      // Use the task context's updateTaskStatus method which handles database updates
      await contextUpdateTaskStatus(taskId, status);
      
      // Refresh the project data after status update
      if (onDataRefresh) {
        await onDataRefresh();
      }
      
      console.log('Task status updated successfully');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
      throw error;
    }
  }, [contextUpdateTaskStatus, onDataRefresh]);

  const handleTaskDialogComplete = useCallback(async () => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
    
    // Refresh data when task dialog is completed
    if (onDataRefresh) {
      await onDataRefresh();
    }
  }, [onDataRefresh]);

  return {
    isRefreshing,
    isCreateTaskOpen,
    editingTask,
    setIsCreateTaskOpen,
    handleEditTask,
    handleCreateTask,
    handleManualRefresh,
    handleTaskStatusChange,
    handleTaskDialogComplete
  };
};
