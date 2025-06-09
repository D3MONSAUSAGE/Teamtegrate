
import React from "react";
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
    <div className="h-full flex flex-col p-4">
      <TaskCardHeader
        title={task.title}
        priority={task.priority}
      />
      
      <div className="flex-1 min-h-0 mt-2">
        <TaskCardDescription description={task.description} />
      </div>
      
      <div className="mt-auto space-y-3">
        <TaskCardMetadata 
          deadline={task.deadline} 
          assignedToName={task.assignedToName}
          assignedToId={task.assignedToId}
          assignedToNames={task.assignedToNames}
          assignedToIds={task.assignedToIds}
          isOverdue={isOverdue}
        />
        
        <TaskCardFooter
          status={task.status}
          isOverdue={isOverdue}
          commentCount={commentCount}
          onStatusChange={handleStatusChange}
          onShowComments={onShowComments}
        />
      </div>
    </div>
  );
};

export default TaskCardContent;
