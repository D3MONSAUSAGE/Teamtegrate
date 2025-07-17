
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
  onStatusChange?: (taskId: string, status: TaskStatus) => Promise<void>;
  onDelete?: () => void;
  onClick?: () => void;
  showProjectInfo?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onAssign,
  onStatusChange,
  onDelete,
  onClick,
  showProjectInfo = false,
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

  const handleStatusChange = async (status: TaskStatus): Promise<void> => {
    if (onStatusChange) {
      await onStatusChange(task.id, status);
    } else {
      await internalHandleStatusChange(status);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      handleDeleteTask(task.id);
    }
  };

  const isOverdue = isTaskOverdue();

  const getPriorityStyles = (priority: string) => {
    switch(priority) {
      case 'High': 
        return {
          glow: 'shadow-red-100/20 dark:shadow-red-900/10 hover:shadow-red-200/30 dark:hover:shadow-red-800/20',
          border: 'hover:border-red-200/40 dark:hover:border-red-700/30'
        };
      case 'Medium': 
        return {
          glow: 'shadow-amber-100/20 dark:shadow-amber-900/10 hover:shadow-amber-200/30 dark:hover:shadow-amber-800/20',
          border: 'hover:border-amber-200/40 dark:hover:border-amber-700/30'
        };
      case 'Low': 
        return {
          glow: 'shadow-blue-100/20 dark:shadow-blue-900/10 hover:shadow-blue-200/30 dark:hover:shadow-blue-800/20',
          border: 'hover:border-blue-200/40 dark:hover:border-blue-700/30'
        };
      default: 
        return {
          glow: 'shadow-gray-100/20 dark:shadow-gray-800/10 hover:shadow-gray-200/30 dark:hover:shadow-gray-700/20',
          border: 'hover:border-gray-200/40 dark:hover:border-gray-700/30'
        };
    }
  };

  const priorityStyles = getPriorityStyles(task.priority);

  return (
    <>
      <Card
        className={cn(
          "group relative cursor-pointer overflow-hidden h-full flex flex-col",
          // Clean professional card styling
          "bg-card border border-border/50",
          "shadow-sm hover:shadow-md",
          // Smooth transitions
          "transition-all duration-300 ease-out",
          "hover:scale-[1.01] hover:-translate-y-0.5",
          // Priority-based styling
          !isOverdue && priorityStyles.glow,
          !isOverdue && priorityStyles.border,
          // Overdue state
          isOverdue && [
            "ring-1 ring-red-400/50 shadow-red-100/30 dark:shadow-red-900/20",
            "bg-red-50/30 dark:bg-red-950/10",
            "border-red-300/50 dark:border-red-600/30"
          ]
        )}
        onClick={handleCardClick}
        tabIndex={0}
        aria-label={`Open details for ${task.title}`}
        role="button"
      >
        {/* Floating action menu */}
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-border/50">
            <TaskCardActions
              task={task}
              onEdit={onEdit}
              onAssign={onAssign}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onShowComments={() => setShowDrawer(true)}
            />
          </div>
        </div>

        {/* Main content - takes full height */}
        <div className="p-4 flex-1 flex flex-col justify-between min-h-0">          
          <TaskCardContent
            task={task}
            handleStatusChange={handleStatusChange}
            commentCount={commentCount}
            onShowComments={() => setShowDrawer(true)}
          />
        </div>
        
        {/* Overdue indicator */}
        {isOverdue && (
          <div className="absolute bottom-3 right-3 z-10">
            <div className="flex items-center gap-1.5 bg-red-500 text-white px-2 py-1 rounded-full shadow-sm text-xs font-medium">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span>Overdue</span>
            </div>
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
