
import { useState } from "react";
import { Task, TaskStatus } from "@/types";
import { useTask } from "@/contexts/task";

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
    updateTaskStatus(task.id, newStatus);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const getAssignedToName = () => {
    // Fixed: Better detection of valid assignment
    // First check if assignedToName exists and is not just whitespace
    if (!task.assignedToName || task.assignedToName.trim() === '') {
      return 'Unassigned';
    }
    
    // Check if assignedToName looks like a UUID (might be an ID instead of a name)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(task.assignedToName)) {
      return 'Unassigned';
    }
    
    // Check for very long strings that might be internal IDs
    if (task.assignedToName.length > 30 && task.assignedToName.includes('-')) {
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
