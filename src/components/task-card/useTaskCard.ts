
import { useState } from "react";
import { Task, TaskStatus } from "@/types";
import { useTask } from "@/contexts/task";
import { toast } from "@/components/ui/sonner";

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

  const isTaskOverdue = () => {
    const now = new Date();
    return task.status !== "Completed" && task.deadline < now;
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    try {
      console.log(`TaskCard: Changing status to ${newStatus} for task ${task.id}`);
      updateTaskStatus(task.id, newStatus);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const getAssignedToName = () => {
    if (!task.assignedToName || task.assignedToName.trim() === '') {
      return 'Unassigned';
    }
    
    if (task.assignedToId && (!task.assignedToName || task.assignedToName === task.assignedToId)) {
      return 'Unassigned';
    }
    
    return task.assignedToName;
  };

  return {
    showDrawer,
    setShowDrawer,
    getPriorityBackground,
    isTaskOverdue,
    handleStatusChange,
    handleDeleteTask,
    getAssignedToName,
    commentCount: task.comments?.length || 0,
  };
};
