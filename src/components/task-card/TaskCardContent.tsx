
import React from "react";
import { Clock, DollarSign, User } from "lucide-react";
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
    <div className="flex flex-col h-full space-y-4">
      {/* Professional header with title and priority */}
      <TaskCardHeader 
        title={task.title}
        priority={task.priority}
      />

      {/* Description section */}
      {task.description && (
        <TaskCardDescription description={task.description} />
      )}

      {/* Metadata section with professional styling */}
      <div className="space-y-3">
        <TaskCardMetadata 
          task={task}
          isOverdue={isOverdue}
        />
        
        {/* Timer integration - minimal and professional */}
        <div className="flex justify-end">
          <TaskTimer 
            taskId={task.id}
            taskTitle={task.title}
            compact={true}
            showControls={false}
            className="justify-end"
          />
        </div>
      </div>

      {/* Footer with status and comments - pushed to bottom */}
      <div className="mt-auto pt-4 border-t border-border/30">
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
