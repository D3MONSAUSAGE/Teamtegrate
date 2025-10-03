
import React from "react";
import { Task, TaskStatus } from "@/types";
import TaskCardHeader from "./TaskCardHeader";
import TaskCardDescription from "./TaskCardDescription";
import TaskCardMetadata from "./TaskCardMetadata";
import TaskCardFooter from "./TaskCardFooter";
import TaskTimer from "../task/TaskTimer";

interface TaskCardContentProps {
  task: Task;
  handleStatusChange: (status: TaskStatus) => Promise<void>;
  commentCount: number;
  onShowComments: () => void;
}

const TaskCardContent: React.FC<TaskCardContentProps> = ({
  task,
  handleStatusChange,
  commentCount,
  onShowComments,
}) => {
  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';

  return (
    <div className="flex flex-row items-center gap-3 w-full">
      {/* Left section - Title and Description */}
      <div className="flex-1 min-w-0 space-y-1">
        <TaskCardHeader 
          title={task.title}
          priority={task.priority}
        />
        {task.description && (
          <TaskCardDescription description={task.description} />
        )}
      </div>

      {/* Center section - Metadata (status, deadline, assignee) */}
      <div className="flex-shrink-0">
        <TaskCardMetadata 
          task={task}
          isOverdue={isOverdue}
        />
      </div>
      
      {/* Right section - Timer and Footer */}
      <div className="flex-shrink-0 flex flex-col items-end gap-2">
        <TaskTimer 
          taskId={task.id}
          taskTitle={task.title}
          compact={true}
          showControls={false}
          className="text-xs"
        />
        <TaskCardFooter
          status={task.status}
          isOverdue={isOverdue}
          commentCount={commentCount}
          onShowComments={onShowComments}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
};

export default TaskCardContent;
