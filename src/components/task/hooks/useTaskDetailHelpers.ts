
import { Task } from "@/types";
import { format } from "date-fns";

export const useTaskDetailHelpers = (task: Task) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'To Do':
        return 'bg-gray-100 text-gray-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'High':
        return 'text-red-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const isOverdue = (): boolean => {
    return new Date(task.deadline) < new Date() && task.status !== 'Completed';
  };

  const formatDate = (date: Date): string => {
    return format(date, 'PPP');
  };

  const formatTime = (date: Date): string => {
    return format(date, 'p');
  };

  const getAssignedToName = (): string => {
    // Check for multiple assignees first
    if (task.assignedToNames && task.assignedToNames.length > 0) {
      if (task.assignedToNames.length === 1) {
        return task.assignedToNames[0];
      } else {
        return `${task.assignedToNames[0]} +${task.assignedToNames.length - 1} others`;
      }
    }
    
    // Fall back to single assignee
    if (task.assignedToName) {
      return task.assignedToName;
    }
    
    return "Unassigned";
  };

  return {
    getStatusColor,
    getPriorityColor,
    isOverdue,
    formatDate,
    formatTime,
    getAssignedToName,
  };
};
