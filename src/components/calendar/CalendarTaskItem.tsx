
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
    const now = new Date();
    return task.status !== 'Completed' && task.deadline < now;
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
              {format(new Date(task.deadline), 'h:mm a')}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarTaskItem;
