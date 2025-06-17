
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
    console.log('🔄 Manual refresh triggered');
    setIsRefreshing(true);
    try {
      if (onDataRefresh) {
        console.log('🔄 Calling onDataRefresh');
        await onDataRefresh();
        console.log('✅ onDataRefresh completed');
      } else {
        console.log('⚠️ No onDataRefresh function provided');
      }
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [onDataRefresh]);

  const handleTaskStatusChange = useCallback(async (taskId: string, status: TaskStatus): Promise<void> => {
    console.log('🎯 handleTaskStatusChange called', { taskId, status });
    console.log('🔗 contextUpdateTaskStatus available:', !!contextUpdateTaskStatus);
    
    try {
      console.log('📡 Starting task status update via context...');
      
      // Use the task context's updateTaskStatus method which handles database updates
      await contextUpdateTaskStatus(taskId, status);
      
      console.log('✅ Context updateTaskStatus completed');
      
      // Refresh the project data after status update
      if (onDataRefresh) {
        console.log('🔄 Refreshing project data after status update');
        await onDataRefresh();
        console.log('✅ Project data refresh completed');
      } else {
        console.log('⚠️ No onDataRefresh function for post-update refresh');
      }
      
      console.log('✅ Task status update flow completed successfully');
    } catch (error) {
      console.error('❌ Error in handleTaskStatusChange:', error);
      toast.error('Failed to update task status');
      throw error;
    }
  }, [contextUpdateTaskStatus, onDataRefresh]);

  const handleTaskDialogComplete = useCallback(async () => {
    console.log('📝 Task dialog completed, refreshing data');
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
