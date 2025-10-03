
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
    <div className="flex flex-col gap-3.5 w-full">
      {/* Title Section */}
      <TaskCardHeader 
        title={task.title}
        priority={task.priority}
      />

      {/* Description Section */}
      {task.description && (
        <TaskCardDescription description={task.description} />
      )}

      {/* Metadata Section (Pills) */}
      <TaskCardMetadata 
        task={task}
        isOverdue={isOverdue}
      />

      {/* Timer Section - Separate row for breathing room */}
      <div className="pt-1">
        <TaskTimer 
          taskId={task.id}
          taskTitle={task.title}
          compact={true}
          showControls={false}
          className="text-xs"
        />
      </div>

      {/* Footer Section - Actions only */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/30">
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
