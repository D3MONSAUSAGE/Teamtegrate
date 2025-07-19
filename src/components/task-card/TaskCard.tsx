
import React from "react";
import { Card } from "@/components/ui/card";
import { Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";
import TaskDetailDialog from "../calendar/TaskDetailDialog";
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
          gradient: '[background:var(--task-gradient-high)]',
          glow: 'shadow-lg hover:shadow-xl shadow-red-500/10 hover:shadow-red-500/20',
          border: 'border-red-200/30 dark:border-red-800/30 hover:border-red-300/50 dark:hover:border-red-700/50',
          accent: 'from-red-500/10 to-red-600/10'
        };
      case 'Medium': 
        return {
          gradient: '[background:var(--task-gradient-medium)]',
          glow: 'shadow-lg hover:shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20',
          border: 'border-amber-200/30 dark:border-amber-800/30 hover:border-amber-300/50 dark:hover:border-amber-700/50',
          accent: 'from-amber-500/10 to-amber-600/10'
        };
      case 'Low': 
        return {
          gradient: '[background:var(--task-gradient-low)]',
          glow: 'shadow-lg hover:shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20',
          border: 'border-blue-200/30 dark:border-blue-800/30 hover:border-blue-300/50 dark:hover:border-blue-700/50',
          accent: 'from-blue-500/10 to-blue-600/10'
        };
      default: 
        return {
          gradient: '[background:var(--task-gradient-default)]',
          glow: 'shadow-lg hover:shadow-xl shadow-gray-500/10 hover:shadow-gray-500/20',
          border: 'border-border/50 hover:border-border',
          accent: 'from-muted/50 to-muted/30'
        };
    }
  };

  const priorityStyles = getPriorityStyles(task.priority);

  return (
    <>
      <Card
        className={cn(
          "group relative cursor-pointer overflow-hidden h-full flex flex-col",
          // Gradient background based on priority
          !isOverdue && priorityStyles.gradient,
          // Border styling
          "border",
          !isOverdue && priorityStyles.border,
          // Shadow and glow effects
          !isOverdue && priorityStyles.glow,
          // Smooth transitions with enhanced effects
          "transition-all duration-300 ease-out",
          "hover:scale-[1.02] hover:-translate-y-1",
          // Backdrop blur for glass effect
          "backdrop-blur-sm",
          // Overdue state with intense styling
          isOverdue && [
            "ring-2 ring-red-500/40 shadow-2xl shadow-red-500/25",
            "[background:linear-gradient(135deg,hsl(0_84%_60%/0.1),hsl(15_78%_65%/0.15),hsl(0_84%_60%/0.08))]",
            "border-red-400/60 dark:border-red-500/50",
            "animate-pulse"
          ]
        )}
        onClick={handleCardClick}
        tabIndex={0}
        aria-label={`Open details for ${task.title}`}
        role="button"
      >
        {/* Subtle gradient overlay */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          `bg-gradient-to-br ${priorityStyles.accent}`,
          "pointer-events-none"
        )} />
        
        {/* Floating action menu */}
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
          <div className="bg-background/95 backdrop-blur-md rounded-xl p-1.5 shadow-2xl border border-border/50 ring-1 ring-white/10">
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

        {/* Main content with enhanced padding and spacing */}
        <div className="relative p-5 flex-1 flex flex-col justify-between min-h-0 z-10">          
          <TaskCardContent
            task={task}
            handleStatusChange={handleStatusChange}
            commentCount={commentCount}
            onShowComments={() => setShowDrawer(true)}
          />
        </div>
      </Card>
      
      <TaskDetailDialog
        open={showDrawer}
        onOpenChange={setShowDrawer}
        task={task}
        onEdit={onEdit}
      />
    </>
  );
};

export default TaskCard;
