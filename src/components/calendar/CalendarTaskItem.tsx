
import React from 'react';
import { Task } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarTaskItemProps {
  task: Task;
  compact?: boolean;
  minimal?: boolean;
  onClick?: () => void;
}

const CalendarTaskItem: React.FC<CalendarTaskItemProps> = ({ 
  task,
  compact = false,
  minimal = false,
  onClick
}) => {
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'Low': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'Medium': return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'High': return 'bg-rose-100 border-rose-300 text-rose-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };
  
  const isOverdue = () => {
    try {
      const now = new Date();
      const deadline = new Date(task.deadline);
      return task.status !== 'Completed' && deadline < now;
    } catch (error) {
      console.error("Invalid deadline date for task:", task.id);
      return false;
    }
  };

  const formatTaskTime = (date: Date | string) => {
    try {
      const taskDate = new Date(date);
      return format(taskDate, 'h:mm a');
    } catch (error) {
      console.error("Invalid date for formatting:", date, error);
      return "Invalid time";
    }
  };
  
  if (minimal) {
    return (
      <div 
        className={cn(
          "text-xs px-1 py-0.5 mb-1 truncate rounded cursor-pointer hover:bg-accent hover:shadow-sm transition-all duration-150",
          isOverdue() ? "text-rose-600 font-medium" : "text-foreground",
          onClick && "cursor-pointer"
        )}
        onClick={onClick}
        title={task.title}
      >
        {task.title}
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "border rounded-md mb-1 cursor-pointer hover:shadow-sm transition-all duration-150",
        getPriorityColor(task.priority),
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="p-2">
        <div className="font-medium text-xs">
          {task.title}
        </div>
        {!compact && (
          <>
            <div className="text-xs mt-1 truncate">
              {task.description}
            </div>
            <div className="text-xs mt-1 font-medium">
              {formatTaskTime(task.deadline)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarTaskItem;
