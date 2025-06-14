
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Flag, AlertCircle } from "lucide-react";
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
          color: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300 dark:from-red-900/50 dark:to-red-800/50 dark:text-red-300 dark:border-red-700',
          icon: AlertCircle,
          iconColor: 'text-red-600 dark:text-red-400'
        };
      case 'Medium': 
        return {
          color: 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300 dark:from-amber-900/50 dark:to-amber-800/50 dark:text-amber-300 dark:border-amber-700',
          icon: Flag,
          iconColor: 'text-amber-600 dark:text-amber-400'
        };
      case 'Low': 
        return {
          color: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 dark:from-blue-900/50 dark:to-blue-800/50 dark:text-blue-300 dark:border-blue-700',
          icon: Flag,
          iconColor: 'text-blue-600 dark:text-blue-400'
        };
      default: 
        return {
          color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300 dark:from-gray-800/50 dark:to-gray-700/50 dark:text-gray-300 dark:border-gray-600',
          icon: Flag,
          iconColor: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  const priorityConfig = getPriorityConfig(priority);
  const PriorityIcon = priorityConfig.icon;

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-base line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-300 flex-1 leading-tight">
          {title}
        </h3>
        <Badge className={cn("text-xs px-2 py-1 flex items-center gap-1 flex-shrink-0 border", priorityConfig.color)}>
          <PriorityIcon className={cn("h-3 w-3", priorityConfig.iconColor)} />
          <span className="font-medium">{priority}</span>
        </Badge>
      </div>
    </div>
  );
};

export default TaskCardHeader;
