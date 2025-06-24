
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
      // Convert the sync function to async by wrapping in Promise.resolve
      await Promise.resolve(onStatusChange(task.id, status));
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
          glow: 'shadow-red-200/50 dark:shadow-red-900/30 hover:shadow-red-300/60 dark:hover:shadow-red-800/40',
          border: 'hover:border-red-300/60 dark:hover:border-red-700/50',
          accent: 'before:bg-gradient-to-r before:from-red-500/15 before:to-transparent'
        };
      case 'Medium': 
        return {
          glow: 'shadow-amber-200/50 dark:shadow-amber-900/30 hover:shadow-amber-300/60 dark:hover:shadow-amber-800/40',
          border: 'hover:border-amber-300/60 dark:hover:border-amber-700/50',
          accent: 'before:bg-gradient-to-r before:from-amber-500/15 before:to-transparent'  
        };
      case 'Low': 
        return {
          glow: 'shadow-blue-200/50 dark:shadow-blue-900/30 hover:shadow-blue-300/60 dark:hover:shadow-blue-800/40',
          border: 'hover:border-blue-300/60 dark:hover:border-blue-700/50',
          accent: 'before:bg-gradient-to-r before:from-blue-500/15 before:to-transparent'
        };
      default: 
        return {
          glow: 'shadow-gray-200/50 dark:shadow-gray-800/30 hover:shadow-gray-300/60 dark:hover:shadow-gray-700/40',
          border: 'hover:border-gray-300/60 dark:hover:border-gray-700/50',
          accent: 'before:bg-gradient-to-r before:from-gray-500/15 before:to-transparent'
        };
    }
  };

  const priorityStyles = getPriorityStyles(task.priority);

  return (
    <>
      <Card
        className={cn(
          "group relative cursor-pointer overflow-hidden h-full min-h-[280px] flex flex-col",
          // Enhanced glass morphism with better depth
          "backdrop-blur-xl bg-gradient-to-br from-background/98 via-background/95 to-background/90",
          "border border-border/40 shadow-lg hover:shadow-xl",
          // Optimized animations
          "transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
          "hover:scale-[1.02] hover:-translate-y-2 transform-gpu",
          // Dynamic priority-based styling
          !isOverdue && priorityStyles.glow,
          !isOverdue && priorityStyles.border,
          // Enhanced overdue state
          isOverdue && [
            "ring-2 ring-red-400/80 shadow-red-200/70 dark:shadow-red-900/50",
            "bg-gradient-to-br from-red-50/95 to-red-100/70 dark:from-red-950/50 dark:to-red-900/40",
            "border-red-400/80 dark:border-red-600/60",
            "hover:shadow-red-300/80 dark:hover:shadow-red-800/70",
            "animate-pulse"
          ],
          // Subtle accent line
          "relative before:absolute before:inset-0 before:rounded-lg before:p-[1px] before:bg-gradient-to-r before:from-transparent before:via-primary/8 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
        )}
        onClick={handleCardClick}
        tabIndex={0}
        aria-label={`Open details for ${task.title}`}
        role="button"
      >
        {/* Floating Action Menu - Enhanced positioning */}
        <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0 scale-90 group-hover:scale-100">
          <div className="backdrop-blur-lg bg-background/90 rounded-xl p-1.5 shadow-xl border border-border/50 ring-1 ring-black/5 dark:ring-white/10">
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

        {/* Main Content with enhanced layout */}
        <div className="relative flex-1 flex flex-col z-10">          
          <TaskCardContent
            task={task}
            handleStatusChange={handleStatusChange}
            commentCount={commentCount}
            onShowComments={() => setShowDrawer(true)}
          />
        </div>
        
        {/* Enhanced Overdue Badge - Compact design */}
        {isOverdue && (
          <div className="absolute bottom-3 right-3 z-20">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm border border-red-400/40 text-xs font-semibold">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              <span>Overdue</span>
            </div>
          </div>
        )}

        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Gradient overlays for depth */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-primary/[0.03] via-primary/[0.015] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-radial from-accent/[0.02] via-accent/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100" />
          
          {/* Floating gradient orbs */}
          <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-primary/[0.015] rounded-full blur-2xl transition-all duration-1000 group-hover:bg-primary/[0.03] group-hover:scale-125 group-hover:-translate-y-2" />
          <div className="absolute -top-6 -left-6 w-16 h-16 bg-secondary/[0.015] rounded-full blur-xl transition-all duration-1000 delay-200 group-hover:bg-secondary/[0.03] group-hover:scale-110" />
        </div>

        {/* Animated border highlight */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-[1px] rounded-lg bg-gradient-to-r from-transparent via-background/50 to-transparent" />
        </div>

        {/* Subtle inner glow effect */}
        <div className="absolute inset-[2px] rounded-lg bg-gradient-to-br from-white/[0.015] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
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
