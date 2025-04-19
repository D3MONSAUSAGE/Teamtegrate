
import React from 'react';
import { Task } from '@/types';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TaskPreviewProps {
  task: Task;
}

const TaskPreview: React.FC<TaskPreviewProps> = ({ task }) => {
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
    <Card className="p-2 mb-2 last:mb-0 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium truncate flex-1">
          {task.title}
        </p>
        <Badge 
          variant="secondary" 
          className={cn("text-xs px-1.5 py-0.5", getStatusColor(task.status))}
        >
          {task.status}
        </Badge>
      </div>
    </Card>
  );
};

export default TaskPreview;
