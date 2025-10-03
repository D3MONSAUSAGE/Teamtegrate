
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
    <div className="flex flex-col gap-4 w-full">
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

      {/* Footer Section */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/30">
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
