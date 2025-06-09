
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
        return "from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800/50";
      case "Medium":
        return "from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200 dark:border-amber-800/50";
      case "High":
        return "from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 border-red-200 dark:border-red-800/50";
      default:
        return "from-gray-50 to-gray-100 dark:from-gray-950/50 dark:to-gray-900/30 border-gray-200 dark:border-gray-800/50";
    }
  };

  return (
    <>
      <Card
        className={cn(
          "relative cursor-pointer rounded-2xl overflow-hidden h-full min-h-[320px] flex flex-col group",
          "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm",
          "border-2 border-border/40 shadow-lg hover:shadow-2xl",
          "transition-all duration-500 ease-out",
          "hover:scale-[1.02] hover:-translate-y-2 hover:border-primary/30",
          "hover:bg-gradient-to-br hover:from-card hover:to-card/80",
          isOverdue && "ring-2 ring-red-400/50 shadow-red-100/50 dark:shadow-red-900/20",
          getPriorityGradient(task.priority)
        )}
        onClick={handleCardClick}
        tabIndex={0}
        aria-label={`Open details for ${task.title}`}
        role="button"
      >
        {/* Priority indicator bar */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl",
          task.priority === "High" && "bg-gradient-to-r from-red-500 to-red-600",
          task.priority === "Medium" && "bg-gradient-to-r from-amber-500 to-amber-600",
          task.priority === "Low" && "bg-gradient-to-r from-blue-500 to-blue-600"
        )} />

        {/* Overdue indicator */}
        {isOverdue && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl" />
        )}

        {/* Actions button (three dots) */}
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
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
          <div className="absolute top-4 left-4 z-20">
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm px-3 py-1.5 rounded-full font-bold shadow-lg animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
              Overdue
            </span>
          </div>
        )}

        {/* Decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/[0.02] pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl transition-all duration-500 group-hover:bg-primary/10" />
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
