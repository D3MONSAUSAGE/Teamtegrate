
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
    <div className="flex flex-col h-full">
      {/* Header with title and priority */}
      <div className="flex-shrink-0 mb-3">
        <TaskCardHeader 
          title={task.title}
          priority={task.priority}
        />
      </div>

      {/* Description section */}
      {task.description && (
        <div className="flex-shrink-0 mb-3">
          <TaskCardDescription description={task.description} />
        </div>
      )}

      {/* Metadata section - takes available space */}
      <div className="flex-1 mb-3">
        <TaskCardMetadata 
          task={task}
          isOverdue={isOverdue}
        />
      </div>
      
      {/* Timer integration */}
      <div className="flex-shrink-0 flex justify-end mb-3">
        <TaskTimer 
          taskId={task.id}
          taskTitle={task.title}
          compact={true}
          showControls={false}
          className="justify-end"
        />
      </div>

      {/* Footer with status and comments */}
      <div className="flex-shrink-0 pt-2 border-t border-border/30">
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
