
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
      case 'Low': return 'priority-low';
      case 'Medium': return 'priority-medium';
      case 'High': return 'priority-high';
      default: return 'priority-low';
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
