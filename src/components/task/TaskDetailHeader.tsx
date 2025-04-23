
import React from "react";
import { DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";

interface TaskDetailHeaderProps {
  title: string;
  status: string;
  description: string;
  getStatusColor: (status: string) => string;
}

const TaskDetailHeader: React.FC<TaskDetailHeaderProps> = ({ title, status, description, getStatusColor }) => (
  <DrawerHeader>
    <DrawerTitle className="flex items-center justify-between">
      <span>{title}</span>
      <Badge className={getStatusColor(status)}>{status}</Badge>
    </DrawerTitle>
    <div
      className="mt-2 text-sm text-muted-foreground whitespace-pre-line px-1 py-2 rounded bg-muted border"
      style={{
        wordBreak: "break-word",
        lineHeight: "1.7",
        maxHeight: "none",
      }}
    >
      {description || <em className="text-xs text-gray-400">No description provided.</em>}
    </div>
  </DrawerHeader>
);

export default TaskDetailHeader;
