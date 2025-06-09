
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
        return 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-700 dark:text-blue-300 border-blue-300/50 dark:border-blue-600/50';
      case 'Medium': 
        return 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-700 dark:text-amber-300 border-amber-300/50 dark:border-amber-600/50';
      case 'High': 
        return 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-700 dark:text-red-300 border-red-300/50 dark:border-red-600/50';
      default: 
        return 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-700 dark:text-blue-300 border-blue-300/50 dark:border-blue-600/50';
    }
  };

  return (
    <CardHeader className="pb-4 space-y-3 p-0">
      <div className="flex items-start justify-between gap-3">
        <CardTitle className="text-lg font-bold leading-tight line-clamp-2 flex-1 min-w-0 text-foreground">
          {title}
        </CardTitle>
        <Badge className={cn(
          "text-xs px-3 py-1.5 shrink-0 font-semibold border backdrop-blur-sm shadow-sm",
          getPriorityColor(priority)
        )}>
          {priority}
        </Badge>
      </div>
    </CardHeader>
  );
};

export default TaskCardHeader;
