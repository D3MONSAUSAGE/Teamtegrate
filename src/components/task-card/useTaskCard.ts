
import { useState } from "react";
import { Task, TaskStatus } from "@/types";
import { useTask } from "@/contexts/task";
import { toast } from "@/components/ui/sonner";
import { isTaskOverdue, isTaskInWarningPeriod } from '@/utils/taskUtils';

export const useTaskCard = (task: Task) => {
  const { updateTaskStatus, deleteTask } = useTask();
  const [showDrawer, setShowDrawer] = useState(false);

  const getPriorityBackground = (priority: string) => {
    switch (priority) {
      case "Low":
        return "bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800";
      case "Medium":
        return "bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-100 border-amber-200 dark:border-amber-800";
      case "High":
        return "bg-rose-50 dark:bg-rose-900/10 text-rose-800 dark:text-rose-100 border-rose-200 dark:border-rose-800";
      default:
        return "bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800";
    }
  };

  const isTaskOverdueUtil = () => {
    return isTaskOverdue(task);
  };

  const isTaskWarning = () => {
    return isTaskInWarningPeriod(task);
  };

  const handleStatusChange = async (newStatus: TaskStatus): Promise<void> => {
    try {
      console.log(`🎯 useTaskCard: Changing status to ${newStatus} for task ${task.id}`);
      await updateTaskStatus(task.id, newStatus);
      console.log('✅ useTaskCard: Status change successful');
    } catch (error) {
      console.error('❌ useTaskCard: Error updating task status:', error);
      toast.error('Failed to update task status');
      throw error; // Re-throw to let the component handle it
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      console.log('🎯 useTaskCard: Deleting task', taskId);
      await deleteTask(taskId);
      // Toast is handled in the deleteTask function
    } catch (error) {
      console.error('❌ useTaskCard: Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const getAssignedToName = () => {
    // If we have a proper name that's not empty and not the same as the ID
    if (task.assignedToName && task.assignedToName.trim() !== '' && task.assignedToName !== task.assignedToId) {
      return task.assignedToName;
    }
    
    // If we have an assignedToId but no proper name, show "Assigned User"
    if (task.assignedToId && task.assignedToId.trim() !== '') {
      return 'Assigned User';
    }
    
    // Otherwise, truly unassigned
    return 'Unassigned';
  };

  return {
    showDrawer,
    setShowDrawer,
    getPriorityBackground,
    isTaskOverdue: isTaskOverdueUtil,
    isTaskWarning,
    handleStatusChange,
    handleDeleteTask,
    getAssignedToName,
    commentCount: task.comments?.length || 0,
  };
};
