
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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Medium': 
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'High': 
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  return (
    <CardHeader className="p-0 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <CardTitle className="text-base font-semibold leading-tight line-clamp-2 flex-1 min-w-0 text-foreground">
          {title}
        </CardTitle>
        <Badge className={cn(
          "text-xs px-2 py-1 shrink-0 font-medium",
          getPriorityColor(priority)
        )}>
          {priority}
        </Badge>
      </div>
    </CardHeader>
  );
};

export default TaskCardHeader;
