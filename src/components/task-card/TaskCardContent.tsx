
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
    <div className="space-y-4">
      {/* Header with title and priority */}
      <TaskCardHeader 
        title={task.title}
        priority={task.priority}
      />

      {/* Description section */}
      {task.description && (
        <TaskCardDescription description={task.description} />
      )}

      {/* Metadata section */}
      <TaskCardMetadata 
        task={task}
        isOverdue={isOverdue}
      />
      
      {/* Timer integration */}
      <div className="flex justify-end">
        <TaskTimer 
          taskId={task.id}
          taskTitle={task.title}
          compact={true}
          showControls={false}
          className="justify-end"
        />
      </div>

      {/* Footer with status and comments */}
      <div className="pt-2 border-t border-border/30">
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
