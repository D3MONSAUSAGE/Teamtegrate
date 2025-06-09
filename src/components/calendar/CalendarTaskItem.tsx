
import React from 'react';
import { Task } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { generateProjectBadgeColor } from '@/utils/colorUtils';
import { useTask } from '@/contexts/task';
import { AlertCircle, Clock, Flag, CheckCircle2, Circle, Pause } from 'lucide-react';

interface CalendarTaskItemProps {
  task: Task;
  compact?: boolean;
  minimal?: boolean;
  onClick?: () => void;
  projectName?: string;
  draggable?: boolean;
}

const CalendarTaskItem: React.FC<CalendarTaskItemProps> = ({ 
  task,
  compact = false,
  minimal = false,
  onClick,
  projectName,
  draggable = false
}) => {
  const { projects } = useTask();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    console.log('Started dragging task:', task.id);
  };

  const getPriorityConfig = (priority: string) => {
    switch(priority) {
      case 'Low': 
        return {
          color: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200',
          icon: Flag,
          iconColor: 'text-blue-500'
        };
      case 'Medium': 
        return {
          color: 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border-amber-200',
          icon: Flag,
          iconColor: 'text-amber-500'
        };
      case 'High': 
        return {
          color: 'bg-gradient-to-r from-rose-50 to-rose-100 text-rose-800 border-rose-200',
          icon: AlertCircle,
          iconColor: 'text-rose-500'
        };
      default: 
        return {
          color: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200',
          icon: Flag,
          iconColor: 'text-gray-500'
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'Completed': 
        return {
          color: 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
          iconColor: 'text-emerald-500'
        };
      case 'In Progress': 
        return {
          color: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200',
          icon: Circle,
          iconColor: 'text-blue-500'
        };
      case 'Pending': 
        return {
          color: 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200',
          icon: Pause,
          iconColor: 'text-yellow-500'
        };
      default: 
        return {
          color: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200',
          icon: Circle,
          iconColor: 'text-gray-500'
        };
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

  // Get project name if not provided
  const displayProjectName = projectName || (task.projectId ? projects.find(p => p.id === task.projectId)?.title : undefined);
  
  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);
  const PriorityIcon = priorityConfig.icon;
  const StatusIcon = statusConfig.icon;
  
  if (minimal) {
    return (
      <div 
        className={cn(
          "group relative text-xs px-2 py-1.5 mb-1 rounded-lg border transition-all duration-200 backdrop-blur-sm",
          "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5",
          statusConfig.color,
          isOverdue() && "ring-2 ring-rose-400 ring-opacity-50 animate-pulse",
          onClick && "cursor-pointer",
          draggable && "cursor-move active:scale-95 active:rotate-2"
        )}
        onClick={onClick}
        draggable={draggable}
        onDragStart={handleDragStart}
        title={`${task.title} - ${task.status} - ${task.priority} priority${displayProjectName ? ` - ${displayProjectName}` : ''}`}
      >
        {/* Enhanced Project color indicator */}
        {task.projectId && (
          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${getProjectIndicatorColor()} opacity-80 group-hover:opacity-100 transition-opacity`} />
        )}
        
        <div className="flex items-center gap-1.5 pl-2">
          <StatusIcon className={cn("h-3 w-3 flex-shrink-0", statusConfig.iconColor)} />
          <div className="font-medium truncate flex-1">{task.title}</div>
          {task.priority === 'High' && (
            <PriorityIcon className={cn("h-3 w-3 flex-shrink-0", priorityConfig.iconColor)} />
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "group border rounded-xl mb-2 transition-all duration-300 bg-gradient-to-br from-card to-card/80 shadow-md relative overflow-hidden backdrop-blur-sm",
        "hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1",
        isOverdue() && "ring-2 ring-rose-400 ring-opacity-50 shadow-rose-100",
        onClick && "cursor-pointer",
        draggable && "cursor-move active:scale-95 active:rotate-1"
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={handleDragStart}
    >
      {/* Enhanced Project color indicator with gradient */}
      {task.projectId && (
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getProjectIndicatorColor()} opacity-80 group-hover:opacity-100 transition-all duration-300`} />
      )}
      
      {/* Subtle top border for completed tasks */}
      {task.status === 'Completed' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
      )}
      
      <div className="p-3 pl-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="font-semibold text-sm truncate flex-1 text-foreground group-hover:text-primary transition-colors">
            {task.title}
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <Badge variant="outline" className={cn("text-xs px-2 py-0.5 flex items-center gap-1", priorityConfig.color)}>
              <PriorityIcon className={cn("h-3 w-3", priorityConfig.iconColor)} />
              {task.priority}
            </Badge>
          </div>
        </div>
        
        {!compact && (
          <>
            <div className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
              {task.description}
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-primary font-medium">
                <Clock className="h-3 w-3" />
                {formatTaskTime(task.deadline)}
              </div>
              <div className="flex items-center gap-2">
                {displayProjectName && (
                  <span className="text-muted-foreground bg-muted/80 px-2 py-1 rounded-md text-xs backdrop-blur-sm">
                    {displayProjectName}
                  </span>
                )}
                <Badge variant="secondary" className={cn("text-xs flex items-center gap-1", statusConfig.color)}>
                  <StatusIcon className={cn("h-3 w-3", statusConfig.iconColor)} />
                  {task.status}
                </Badge>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />
    </div>
  );
};

export default CalendarTaskItem;
