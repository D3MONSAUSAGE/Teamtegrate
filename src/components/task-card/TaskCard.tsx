
import React from "react";
import { Card } from "@/components/ui/card";
import { Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";
import TaskDetailDrawer from "../task/TaskDetailDrawer";
import TaskCardActions from "./TaskCardActions";
import TaskCardContent from "./TaskCardContent";
import { useTaskCard } from "./useTaskCard";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onAssign?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onAssign,
  onStatusChange,
  onClick,
}) => {
  const {
    showDrawer,
    setShowDrawer,
    getPriorityBackground,
    isTaskOverdue,
    handleStatusChange: internalHandleStatusChange,
    handleDeleteTask,
    commentCount,
  } = useTaskCard(task);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowDrawer(true);
    }
  };

  // Use the external status change handler if provided, otherwise use the internal one
  const handleStatusChange = (status: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(task.id, status);
    } else {
      internalHandleStatusChange(status);
    }
  };

  const isOverdue = isTaskOverdue();

  return (
    <>
      <Card
        className={cn(
          "relative transition-all duration-200 cursor-pointer rounded-lg overflow-hidden h-full min-h-[280px] flex flex-col group hover:shadow-lg hover:-translate-y-1",
          "border bg-card",
          isOverdue && "border-red-500/50 shadow-red-100"
        )}
        onClick={handleCardClick}
        tabIndex={0}
        aria-label={`Open details for ${task.title}`}
        role="button"
      >
        {/* Overdue indicator */}
        {isOverdue && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
        )}

        {/* Actions button (three dots) */}
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <TaskCardActions
            task={task}
            onEdit={onEdit}
            onAssign={onAssign}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
            onShowComments={() => setShowDrawer(true)}
          />
        </div>

        {/* Main Content */}
        <TaskCardContent
          task={task}
          handleStatusChange={handleStatusChange}
          commentCount={commentCount}
          onShowComments={() => setShowDrawer(true)}
        />
        
        {/* Overdue Label */}
        {isOverdue && (
          <div className="absolute top-3 left-3 z-20">
            <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs px-2 py-1 rounded-md font-medium">
              <div className="w-1 h-1 bg-white rounded-full" />
              Overdue
            </span>
          </div>
        )}
      </Card>
      <TaskDetailDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        task={task}
      />
    </>
  );
};

export default TaskCard;
