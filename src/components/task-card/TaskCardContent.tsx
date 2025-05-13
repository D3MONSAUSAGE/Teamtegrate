
import React from "react";
import { Task, TaskStatus } from "@/types";
import { CardContent } from "@/components/ui/card";
import TaskCardHeader from "./TaskCardHeader";
import TaskCardDescription from "./TaskCardDescription";
import TaskCardMetadata from "./TaskCardMetadata";
import TaskCardFooter from "@/components/task/TaskCardFooter";
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
  const { title, description, deadline, priority, status, assignedToName } = task;
  const isOverdue = isTaskOverdue(task);

  return (
    <CardContent className="p-5 pt-10">
      <TaskCardHeader title={title} priority={priority} />
      <TaskCardDescription description={description} />
      <TaskCardMetadata
        deadline={deadline}
        isOverdue={isOverdue}
        assignedToName={assignedToName}
      />
      <TaskCardFooter
        status={status}
        isOverdue={isOverdue}
        commentCount={commentCount}
        onShowComments={onShowComments}
        onStatusChange={handleStatusChange}
      />
    </CardContent>
  );
};

export default TaskCardContent;
