import { Task } from "@/types";
import { format as formatDateFns } from "date-fns";

export const useTaskDetailHelpers = (task: Task) => {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'To Do': return 'bg-slate-100 hover:bg-slate-200 text-slate-700';
      case 'In Progress': return 'bg-blue-100 hover:bg-blue-200 text-blue-700';
      case 'Done': return 'bg-green-100 hover:bg-green-200 text-green-700';
      default: return '';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'Low': return 'bg-blue-100 hover:bg-blue-200 text-blue-700';
      case 'Medium': return 'bg-amber-100 hover:bg-amber-200 text-amber-700';
      case 'High': return 'bg-rose-100 hover:bg-rose-200 text-rose-700';
      default: return '';
    }
  };

  const isOverdue = () => {
    try {
      const now = new Date();
      const deadline = new Date(task.deadline);
      return task.status !== 'Done' && deadline < now;
    } catch (error) {
      console.error("Invalid deadline date for task:", task.id);
      return false;
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const formattedDate = new Date(date);
      return formatDateFns(formattedDate, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const formatTime = (date: Date | string) => {
    try {
      const formattedDate = new Date(date);
      return formatDateFns(formattedDate, "h:mm a");
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  const getAssignedToName = () => {
    if (!task.assignedToName || task.assignedToName.trim() === '') {
      return 'Unassigned';
    }
    
    if (task.assigned_to_id && (!task.assignedToName || task.assignedToName === task.assigned_to_id)) {
      return 'Unassigned';
    }
    
    return task.assignedToName;
  };

  return {
    getStatusColor,
    getPriorityColor,
    isOverdue: isOverdue(),
    formatDate,
    formatTime,
    getAssignedToName
  };
};
