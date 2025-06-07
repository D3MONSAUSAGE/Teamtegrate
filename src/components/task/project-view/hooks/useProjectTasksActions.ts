
import { useState, useCallback } from 'react';
import { Task, TaskStatus } from '@/types';
import { toast } from '@/components/ui/sonner';

interface UseProjectTasksActionsProps {
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
}

export const useProjectTasksActions = ({ updateTaskStatus }: UseProjectTasksActionsProps) => {
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
    // Refresh logic would go here if needed
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleTaskStatusChange = useCallback(async (taskId: string, status: TaskStatus): Promise<void> => {
    try {
      await updateTaskStatus(taskId, status);
      toast.success(`Task status updated to ${status}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  }, [updateTaskStatus]);

  const handleTaskDialogComplete = useCallback(() => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
  }, []);

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
