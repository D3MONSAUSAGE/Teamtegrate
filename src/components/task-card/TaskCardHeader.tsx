
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskCardHeaderProps {
  title: string;
  priority: string;
}

const TaskCardHeader: React.FC<TaskCardHeaderProps> = ({ title, priority }) => {
  return (
    <h3 className="font-bold text-lg leading-tight text-foreground line-clamp-2 break-words">
      {title}
    </h3>
  );
};

export default TaskCardHeader;
