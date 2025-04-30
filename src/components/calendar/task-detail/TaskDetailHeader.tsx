
import React from "react";
import { Badge } from "@/components/ui/badge";
import { DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

interface TaskDetailHeaderProps {
  title: string;
  status: string;
  description: string;
  getStatusColor: (status: string) => string;
}

const TaskDetailHeader: React.FC<TaskDetailHeaderProps> = ({ 
  title, 
  status, 
  description,
  getStatusColor 
}) => {
  return (
    <DrawerHeader>
      <DrawerTitle className="flex items-center justify-between">
        <span className="mr-2">{title}</span>
        <Badge className={getStatusColor(status)}>
          {status}
        </Badge>
      </DrawerTitle>
      <DrawerDescription className="text-sm text-muted-foreground mt-2">
        {description}
      </DrawerDescription>
    </DrawerHeader>
  );
};

export default TaskDetailHeader;
