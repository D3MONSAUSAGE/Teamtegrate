
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Flag, AlertCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardHeaderProps {
  title: string;
  priority: string;
}

const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({ title, priority }) => {
  const getPriorityConfig = (priority: string) => {
    switch(priority) {
      case 'High': 
        return {
          color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/50',
          icon: AlertCircle,
          iconColor: 'text-red-600 dark:text-red-400'
        };
      case 'Medium': 
        return {
          color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50',
          icon: Flag,
          iconColor: 'text-amber-600 dark:text-amber-400'
        };
      case 'Low': 
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50',
          icon: Star,
          iconColor: 'text-blue-600 dark:text-blue-400'
        };
      default: 
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-600/50',
          icon: Flag,
          iconColor: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  const priorityConfig = getPriorityConfig(priority);
  const PriorityIcon = priorityConfig.icon;

  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base leading-tight text-foreground line-clamp-2 mb-1">
          {title}
        </h3>
      </div>
      <div className="flex-shrink-0">
        <Badge className={cn(
          "text-xs px-2 py-1 flex items-center gap-1 border font-medium",
          "transition-colors duration-200",
          priorityConfig.color
        )}>
          <PriorityIcon className={cn("h-3 w-3", priorityConfig.iconColor)} />
          <span>{priority}</span>
        </Badge>
      </div>
    </div>
  );
};

export default TaskCardHeader;
