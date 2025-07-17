
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
          accent: 'before:bg-gradient-to-r before:from-red-500/20 before:to-red-500/5',
          glow: 'shadow-red-100/30 dark:shadow-red-900/20 hover:shadow-red-200/40 dark:hover:shadow-red-800/30',
          border: 'hover:border-red-200/50 dark:hover:border-red-700/40'
        };
      case 'Medium': 
        return {
          accent: 'before:bg-gradient-to-r before:from-amber-500/20 before:to-amber-500/5',
          glow: 'shadow-amber-100/30 dark:shadow-amber-900/20 hover:shadow-amber-200/40 dark:hover:shadow-amber-800/30',
          border: 'hover:border-amber-200/50 dark:hover:border-amber-700/40'
        };
      case 'Low': 
        return {
          accent: 'before:bg-gradient-to-r before:from-blue-500/20 before:to-blue-500/5',
          glow: 'shadow-blue-100/30 dark:shadow-blue-900/20 hover:shadow-blue-200/40 dark:hover:shadow-blue-800/30',
          border: 'hover:border-blue-200/50 dark:hover:border-blue-700/40'
        };
      default: 
        return {
          accent: 'before:bg-gradient-to-r before:from-gray-500/15 before:to-gray-500/5',
          glow: 'shadow-gray-100/30 dark:shadow-gray-800/20 hover:shadow-gray-200/40 dark:hover:shadow-gray-700/30',
          border: 'hover:border-gray-200/50 dark:hover:border-gray-700/40'
        };
    }
  };

  const priorityStyles = getPriorityStyles(task.priority);

  return (
    <>
      <Card
        className={cn(
          "group relative cursor-pointer overflow-hidden min-h-[320px] flex flex-col",
          // Enhanced professional card styling
          "bg-gradient-to-br from-card/98 via-card/96 to-card/94",
          "border border-border/60 shadow-lg hover:shadow-xl",
          "backdrop-blur-sm",
          // Smooth professional animations
          "transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
          "hover:scale-[1.02] hover:-translate-y-1 transform-gpu",
          // Dynamic priority-based styling
          !isOverdue && priorityStyles.glow,
          !isOverdue && priorityStyles.border,
          // Enhanced overdue state with professional styling
          isOverdue && [
            "ring-2 ring-red-400/60 shadow-red-100/50 dark:shadow-red-900/40",
            "bg-gradient-to-br from-red-50/80 to-red-100/60 dark:from-red-950/30 dark:to-red-900/20",
            "border-red-300/70 dark:border-red-600/50",
            "hover:shadow-red-200/60 dark:hover:shadow-red-800/50"
          ],
          // Professional accent overlay
          "relative before:absolute before:inset-0 before:rounded-lg before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
          priorityStyles.accent
        )}
        onClick={handleCardClick}
        tabIndex={0}
        aria-label={`Open details for ${task.title}`}
        role="button"
      >
        {/* Professional floating action menu */}
        <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 scale-95 group-hover:scale-100">
          <div className="backdrop-blur-xl bg-background/95 rounded-2xl p-2 shadow-2xl border border-border/50 ring-1 ring-black/5 dark:ring-white/5">
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

        {/* Enhanced main content with professional spacing */}
        <div className="relative flex-1 flex flex-col z-10 p-6">          
          <TaskCardContent
            task={task}
            handleStatusChange={handleStatusChange}
            commentCount={commentCount}
            onShowComments={() => setShowDrawer(true)}
          />
        </div>
        
        {/* Professional overdue indicator */}
        {isOverdue && (
          <div className="absolute bottom-4 right-4 z-20">
            <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-3 py-1.5 rounded-full shadow-xl backdrop-blur-sm border border-red-400/30 text-xs font-bold tracking-wide">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
              <span>Overdue</span>
            </div>
          </div>
        )}

        {/* Professional background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {/* Subtle gradient overlays */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-radial from-primary/[0.02] via-primary/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-radial from-accent/[0.02] via-accent/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-200" />
          
          {/* Professional floating elements */}
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/[0.01] rounded-full blur-3xl transition-all duration-1000 group-hover:bg-primary/[0.02] group-hover:scale-125 group-hover:-translate-y-2" />
          <div className="absolute -top-8 -left-8 w-20 h-20 bg-secondary/[0.01] rounded-full blur-2xl transition-all duration-1000 delay-300 group-hover:bg-secondary/[0.02] group-hover:scale-110" />
        </div>

        {/* Professional border highlight */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-primary/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-[1px] rounded-lg bg-gradient-to-r from-transparent via-background/30 to-transparent" />
        </div>

        {/* Subtle inner highlight */}
        <div className="absolute inset-[2px] rounded-lg bg-gradient-to-br from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
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
