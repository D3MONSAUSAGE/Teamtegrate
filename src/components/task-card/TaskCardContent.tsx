
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
    <div className="flex flex-col h-full min-h-[280px]">
      {/* Header with title and priority */}
      <div className="flex-shrink-0 mb-3">
        <TaskCardHeader 
          title={task.title}
          priority={task.priority}
        />
      </div>

      {/* Description section - always reserve space */}
      <div className="flex-shrink-0 mb-3 min-h-[40px]">
        {task.description ? (
          <TaskCardDescription description={task.description} />
        ) : (
          <div className="text-xs text-muted-foreground/50 italic">No description</div>
        )}
      </div>

      {/* Metadata section - takes available space */}
      <div className="flex-1 mb-4">
        <TaskCardMetadata 
          task={task}
          isOverdue={isOverdue}
        />
      </div>
      
      {/* Enhanced Timer integration - more prominent display */}
      <div className="flex-shrink-0 mb-4">
        <TaskTimer 
          taskId={task.id}
          taskTitle={task.title}
          compact={true}
          showControls={true}
          className="w-full"
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
