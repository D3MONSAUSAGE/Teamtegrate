
import React from 'react';
import { Task } from '@/types';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronRight } from 'lucide-react';

interface TaskPreviewProps {
  task: Task;
  onClick?: () => void;
}

const TaskPreview: React.FC<TaskPreviewProps> = ({ task, onClick }) => {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'To Do': return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Card 
      className={cn(
        "p-2 mb-2 last:mb-0 transition-all duration-300 ease-in-out",
        "hover:shadow-md hover:bg-gray-50 hover:translate-x-1",
        "cursor-pointer group",
        "border border-transparent hover:border-primary/20"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium truncate flex-1 transition-colors group-hover:text-primary/80">
          {task.title}
        </p>
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs px-1.5 py-0.5 transition-colors duration-300",
              getStatusColor(task.status)
            )}
          >
            {task.status}
          </Badge>
          <ChevronRight 
            className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" 
          />
        </div>
      </div>
    </Card>
  );
};

export default TaskPreview;

