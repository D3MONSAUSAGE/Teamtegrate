
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Task } from '@/types';

interface TaskCardHeaderProps {
  title: string;
  priority: string;
}

const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({ title, priority }) => {
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'Low': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200';
      case 'Medium': return 'bg-emerald-200 dark:bg-emerald-800/40 text-emerald-900 dark:text-emerald-100';
      case 'High': return 'bg-emerald-300 dark:bg-emerald-700/50 text-emerald-950 dark:text-emerald-50';
      default: return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200';
    }
  };

  return (
    <CardHeader className="pb-1 md:pb-2 flex flex-row justify-between items-start">
      <div className="min-w-0 flex-grow">
        <CardTitle 
          className="text-sm md:text-base break-words overflow-wrap-anywhere" 
          title={title}
        >
          {title}
        </CardTitle>
      </div>
      <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
        <Badge className={cn(getPriorityColor(priority), "text-xs md:text-sm px-1.5 py-0.5")}>
          {priority}
        </Badge>
      </div>
    </CardHeader>
  );
};

export default TaskCardHeader;
