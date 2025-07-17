
import React from "react";
import { Clock, DollarSign, User } from "lucide-react";
import { Task, TaskStatus } from "@/types";
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
    <div className="px-4 pb-4 space-y-3 flex-1 flex flex-col">
      {/* Top info row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground/80">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span className="font-medium">
            {new Date(task.deadline).toLocaleDateString()}
          </span>
        </div>
        
        {task.cost && task.cost > 0 && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span className="font-medium">${task.cost}</span>
          </div>
        )}
      </div>

      {/* Timer section - positioned above footer */}
      <div className="flex justify-end">
        <TaskTimer 
          taskId={task.id}
          taskTitle={task.title}
          compact={true}
          showControls={false}
          className="justify-end"
        />
      </div>

      {/* Assignee info */}
      {(task.assignedToNames && task.assignedToNames.length > 0) && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
          <User className="h-3 w-3" />
          <span className="truncate font-medium">
            {task.assignedToNames[0]}
            {task.assignedToNames.length > 1 && ` +${task.assignedToNames.length - 1}`}
          </span>
        </div>
      )}

      {/* Footer with status */}
      <div className="mt-auto">
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
