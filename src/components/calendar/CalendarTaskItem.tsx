
import React from 'react';
import { Task } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { generateProjectColor, generateProjectBadgeColor } from '@/utils/colorUtils';

interface CalendarTaskItemProps {
  task: Task;
  compact?: boolean;
  minimal?: boolean;
  onClick?: () => void;
  projectName?: string;
}

const CalendarTaskItem: React.FC<CalendarTaskItemProps> = ({ 
  task,
  compact = false,
  minimal = false,
  onClick,
  projectName
}) => {
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'High': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProjectIndicatorColor = () => {
    return generateProjectBadgeColor(task.projectId, projectName);
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
          "text-xs px-2 py-1 mb-1 truncate rounded cursor-pointer border transition-all duration-200 relative",
          "hover:shadow-sm hover:scale-[1.02]",
          getStatusColor(task.status),
          isOverdue() && "ring-1 ring-rose-400",
          onClick && "cursor-pointer"
        )}
        onClick={onClick}
        title={`${task.title} - ${task.status} - ${task.priority} priority${projectName ? ` - ${projectName}` : ''}`}
      >
        {/* Project color indicator */}
        {task.projectId && (
          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${getProjectIndicatorColor()}`} />
        )}
        <div className="font-medium truncate pl-2">{task.title}</div>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "border rounded-lg mb-2 cursor-pointer transition-all duration-200 bg-card shadow-sm relative overflow-hidden",
        "hover:shadow-md hover:scale-[1.02]",
        isOverdue() && "ring-2 ring-rose-400 ring-opacity-50",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Project color indicator */}
      {task.projectId && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getProjectIndicatorColor()}`} />
      )}
      
      <div className="p-3 pl-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="font-semibold text-sm truncate flex-1">
            {task.title}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Badge variant="outline" className={cn("text-xs px-1 py-0", getPriorityColor(task.priority))}>
              {task.priority}
            </Badge>
          </div>
        </div>
        
        {!compact && (
          <>
            <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {task.description}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-primary">
                {formatTaskTime(task.deadline)}
              </span>
              <div className="flex items-center gap-2">
                {projectName && (
                  <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {projectName}
                  </span>
                )}
                <Badge variant="secondary" className={cn("text-xs", getStatusColor(task.status))}>
                  {task.status}
                </Badge>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarTaskItem;
