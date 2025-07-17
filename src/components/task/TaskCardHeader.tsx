
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskCardHeaderProps {
  title: string;
  priority: string;
}

const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({ title, priority }) => {
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'Low': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 'Medium': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800';
      case 'High': return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 dark:bg-gray-800/40 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base leading-tight text-foreground line-clamp-2 break-words tracking-tight">
          {title}
        </h3>
      </div>
      <div className="flex-shrink-0">
        <Badge 
          variant="outline"
          className={cn(
            "text-xs font-medium px-2.5 py-0.5 border",
            "shadow-sm transition-all duration-300",
            "flex items-center gap-1.5",
            getPriorityColor(priority)
          )}
        >
          {priority === 'High' && <span className="block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
          {priority === 'Medium' && <span className="block w-1.5 h-1.5 rounded-full bg-amber-500" />}
          {priority === 'Low' && <span className="block w-1.5 h-1.5 rounded-full bg-blue-500" />}
          <span>{priority}</span>
        </Badge>
      </div>
    </div>
  );
};

export default TaskCardHeader;
