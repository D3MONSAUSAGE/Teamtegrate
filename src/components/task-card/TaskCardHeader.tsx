
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskCardHeaderProps {
  title: string;
  priority: string;
}

const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({ title, priority }) => {
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'Low': 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-800/50';
      case 'Medium': 
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-amber-200 dark:border-amber-800/50';
      case 'High': 
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800/50';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200 border-gray-200 dark:border-gray-800/50';
    }
  };

  return (
    <CardHeader className="p-0 pb-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <CardTitle className="text-base font-semibold leading-tight line-clamp-2 flex-1 min-w-0 text-foreground group-hover:text-primary/90 transition-colors duration-200">
          {title}
        </CardTitle>
        <Badge className={cn(
          "text-xs px-2.5 py-1 shrink-0 font-medium rounded-md border",
          getPriorityColor(priority)
        )}>
          {priority}
        </Badge>
      </div>
    </CardHeader>
  );
};

export default TaskCardHeader;
