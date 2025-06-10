
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, Clock, Zap } from 'lucide-react';

interface TaskCardHeaderProps {
  title: string;
  priority: string;
}

const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({ title, priority }) => {
  const getPriorityConfig = (priority: string) => {
    switch(priority) {
      case 'Low': 
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-300 dark:border-blue-700',
          icon: Clock,
          size: 'text-sm px-3 py-1.5'
        };
      case 'Medium': 
        return {
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-amber-300 dark:border-amber-700',
          icon: AlertCircle,
          size: 'text-sm px-3 py-1.5'
        };
      case 'High': 
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-300 dark:border-red-700',
          icon: Zap,
          size: 'text-sm px-3 py-1.5'
        };
      default: 
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200 border-gray-300 dark:border-gray-700',
          icon: Clock,
          size: 'text-sm px-3 py-1.5'
        };
    }
  };

  const priorityConfig = getPriorityConfig(priority);
  const PriorityIcon = priorityConfig.icon;

  return (
    <CardHeader className="p-0 pb-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <CardTitle className="text-base font-semibold leading-tight line-clamp-2 flex-1 min-w-0 text-foreground group-hover:text-primary/90 transition-colors duration-200">
          {title}
        </CardTitle>
        <Badge className={cn(
          "shrink-0 font-semibold rounded-lg border-2 shadow-sm",
          "flex items-center gap-1.5 transition-all duration-200",
          "hover:scale-105 hover:shadow-md",
          priorityConfig.color,
          priorityConfig.size
        )}>
          <PriorityIcon className="h-3.5 w-3.5" />
          {priority}
        </Badge>
      </div>
    </CardHeader>
  );
};

export default TaskCardHeader;
