
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Task, TaskStatus } from "@/types";
import TaskCardHeader from "./TaskCardHeader";
import TaskCardDescription from "./TaskCardDescription";
import TaskCardMetadata from "./TaskCardMetadata";
import TaskCardFooter from "./TaskCardFooter";
import { isTaskOverdue } from "@/utils/taskUtils";

interface TaskCardContentProps {
  task: Task;
  handleStatusChange: (status: TaskStatus) => void;
  commentCount: number;
  onShowComments: () => void;
}

const TaskCardContent: React.FC<TaskCardContentProps> = ({
  task,
  handleStatusChange,
  commentCount,
  onShowComments,
}) => {
  const isOverdue = isTaskOverdue(task);

  return (
    <CardContent className="p-3 md:p-4 h-full flex flex-col">
      <TaskCardHeader
        title={task.title}
        priority={task.priority}
      />
      
      <TaskCardDescription description={task.description} />
      
      <div className="flex-1" />
      
      <TaskCardMetadata 
        deadline={task.deadline} 
        assignedToName={task.assignedToName}
        assignedToId={task.assignedToId}
        isOverdue={isOverdue}
      />
      
      <TaskCardFooter
        status={task.status}
        isOverdue={isOverdue}
        commentCount={commentCount}
        onStatusChange={handleStatusChange}
        onShowComments={onShowComments}
      />
    </CardContent>
  );
};

export default TaskCardContent;
