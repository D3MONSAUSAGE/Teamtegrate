
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

  // Use the external status change handler if provided, otherwise use the internal one
  const handleStatusChange = (status: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(task.id, status);
    } else {
      internalHandleStatusChange(status);
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

  const getPriorityGlow = (priority: string) => {
    switch(priority) {
      case 'High': return 'shadow-red-100/40 dark:shadow-red-900/20';
      case 'Medium': return 'shadow-amber-100/40 dark:shadow-amber-900/20';
      case 'Low': return 'shadow-blue-100/40 dark:shadow-blue-900/20';
      default: return '';
    }
  };

  const getPriorityRibbon = (priority: string) => {
    switch(priority) {
      case 'High': 
        return 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-red-200/60 dark:shadow-red-800/40';
      case 'Medium': 
        return 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-amber-200/60 dark:shadow-amber-800/40';
      case 'Low': 
        return 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-blue-200/60 dark:shadow-blue-800/40';
      default: 
        return 'bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 shadow-gray-200/60 dark:shadow-gray-800/40';
    }
  };

  return (
    <>
      <Card
        className={cn(
          "group relative cursor-pointer overflow-hidden h-full min-h-[340px] flex flex-col",
          // Enhanced glass morphism base
          "backdrop-blur-xl bg-gradient-to-br from-background/95 via-background/90 to-background/85",
          "border border-border/30 shadow-lg hover:shadow-2xl",
          // Sophisticated transitions
          "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "hover:scale-[1.02] hover:-translate-y-2 hover:border-primary/40",
          // Priority-based subtle glow
          !isOverdue && getPriorityGlow(task.priority),
          // Overdue state - red alert styling
          isOverdue && [
            "ring-2 ring-red-400/70 shadow-red-100/60 dark:shadow-red-900/40",
            "bg-gradient-to-br from-red-50/90 to-red-100/60 dark:from-red-950/40 dark:to-red-900/30",
            "border-red-300/70 dark:border-red-700/50",
            "hover:shadow-red-200/80 dark:hover:shadow-red-800/60"
          ]
        )}
        onClick={handleCardClick}
        tabIndex={0}
        aria-label={`Open details for ${task.title}`}
        role="button"
      >
        {/* Priority Corner Ribbon - Top Left - Smaller to avoid title overlap */}
        <div className="absolute top-0 left-0 w-12 h-12 overflow-hidden z-10">
          <div className={cn(
            "absolute top-2 -left-2 w-16 h-4 shadow-md transform -rotate-45 transition-all duration-300 group-hover:scale-110",
            getPriorityRibbon(task.priority)
          )} />
        </div>

        {/* Floating Action Button - Top Right - Adjusted position */}
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <div className="backdrop-blur-md bg-background/80 rounded-full p-1 shadow-lg border border-border/40">
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

        {/* Enhanced Content Container */}
        <div className="relative flex-1 flex flex-col">          
          <TaskCardContent
            task={task}
            handleStatusChange={handleStatusChange}
            commentCount={commentCount}
            onShowComments={() => setShowDrawer(true)}
          />
        </div>
        
        {/* Enhanced Overdue Indicator - Bottom Right Corner */}
        {isOverdue && (
          <div className="absolute bottom-3 right-3 z-20">
            <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-full shadow-lg backdrop-blur-sm border border-red-400/30 text-xs">
              <div className="w-1 h-1 bg-white rounded-full animate-ping" />
              <span className="font-semibold">Overdue</span>
            </div>
          </div>
        )}

        {/* Ambient Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Subtle corner highlights */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-primary/[0.03] to-transparent" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-radial from-accent/[0.02] to-transparent" />
          
          {/* Floating gradient orb */}
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-primary/[0.02] rounded-full blur-xl transition-all duration-700 group-hover:bg-primary/[0.04] group-hover:scale-125" />
        </div>

        {/* Interactive Border Highlight */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
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
