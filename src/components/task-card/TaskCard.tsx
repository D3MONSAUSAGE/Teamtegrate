
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

  const getPriorityGradient = (priority: string) => {
    switch (priority) {
      case "Low":
        return "from-blue-50/80 to-blue-100/60 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/60 dark:border-blue-800/40";
      case "Medium":
        return "from-amber-50/80 to-amber-100/60 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/60 dark:border-amber-800/40";
      case "High":
        return "from-red-50/80 to-red-100/60 dark:from-red-950/30 dark:to-red-900/20 border-red-200/60 dark:border-red-800/40";
      default:
        return "from-gray-50/80 to-gray-100/60 dark:from-gray-950/30 dark:to-gray-900/20 border-gray-200/60 dark:border-gray-800/40";
    }
  };

  return (
    <>
      <Card
        className={cn(
          "relative cursor-pointer rounded-xl overflow-hidden h-full min-h-[300px] flex flex-col group",
          "bg-gradient-to-br from-card/95 to-card/85 backdrop-blur-sm",
          "border border-border/50 shadow-sm hover:shadow-md",
          "transition-all duration-300 ease-out",
          "hover:scale-[1.01] hover:-translate-y-1 hover:border-primary/40",
          "hover:bg-gradient-to-br hover:from-card hover:to-card/90",
          isOverdue && "ring-1 ring-red-400/40 shadow-red-100/30 dark:shadow-red-900/10",
          getPriorityGradient(task.priority)
        )}
        onClick={handleCardClick}
        tabIndex={0}
        aria-label={`Open details for ${task.title}`}
        role="button"
      >
        {/* Priority indicator bar */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1 rounded-t-xl",
          task.priority === "High" && "bg-gradient-to-r from-red-400 to-red-500",
          task.priority === "Medium" && "bg-gradient-to-r from-amber-400 to-amber-500",
          task.priority === "Low" && "bg-gradient-to-r from-blue-400 to-blue-500"
        )} />

        {/* Overdue indicator */}
        {isOverdue && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-500 rounded-t-xl" />
        )}

        {/* Actions button (three dots) */}
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-105">
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
        
        {/* Overdue Label - Now positioned at bottom right */}
        {isOverdue && (
          <div className="absolute bottom-3 right-3 z-20">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2.5 py-1 rounded-lg font-semibold shadow-sm animate-pulse">
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
