
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
          "relative cursor-pointer rounded-xl overflow-hidden h-full min-h-[300px] flex flex-col group",
          // Base styling - neutral background for all cards
          "bg-gradient-to-br from-card/95 to-card/85 backdrop-blur-sm",
          "border border-border/50 shadow-sm hover:shadow-md",
          "transition-all duration-300 ease-out",
          "hover:scale-[1.01] hover:-translate-y-1 hover:border-primary/40",
          "hover:bg-gradient-to-br hover:from-card hover:to-card/90",
          // Overdue styling - only applied when task is overdue
          isOverdue && [
            "ring-2 ring-red-400/60 shadow-red-100/40 dark:shadow-red-900/20",
            "bg-gradient-to-br from-red-50/80 to-red-100/60 dark:from-red-950/30 dark:to-red-900/20",
            "border-red-200/60 dark:border-red-800/40",
            "hover:from-red-50/90 hover:to-red-100/70 dark:hover:from-red-950/40 dark:hover:to-red-900/30"
          ]
        )}
        onClick={handleCardClick}
        tabIndex={0}
        aria-label={`Open details for ${task.title}`}
        role="button"
      >
        {/* Priority indicator bar - enhanced visibility */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-2 rounded-t-xl",
          task.priority === "High" && "bg-gradient-to-r from-red-500 to-red-600 shadow-red-200/50",
          task.priority === "Medium" && "bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-200/50",
          task.priority === "Low" && "bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-200/50"
        )} />

        {/* Actions button (three dots) */}
        <div className="absolute top-4 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-105">
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
        
        {/* Overdue Label - Enhanced styling */}
        {isOverdue && (
          <div className="absolute bottom-3 right-3 z-20">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold shadow-lg animate-pulse">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              Overdue
            </span>
          </div>
        )}

        {/* Subtle decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/[0.01] pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/3 rounded-full blur-2xl transition-all duration-300 group-hover:bg-primary/5" />
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
