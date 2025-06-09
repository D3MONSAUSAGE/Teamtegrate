
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
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25';
      case 'Medium': 
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25';
      case 'High': 
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25';
      default: 
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25';
    }
  };

  return (
    <CardHeader className="p-6 pb-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <CardTitle className="text-lg font-bold leading-tight line-clamp-2 flex-1 min-w-0 text-foreground group-hover:text-primary transition-colors duration-300">
          {title}
        </CardTitle>
        <Badge className={cn(
          "text-xs px-3 py-1.5 shrink-0 font-bold border-0 rounded-full transition-all duration-300 hover:scale-105",
          getPriorityColor(priority)
        )}>
          {priority}
        </Badge>
      </div>
    </CardHeader>
  );
};

export default TaskCardHeader;
