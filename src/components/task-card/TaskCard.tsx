
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
    isTaskWarning,
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
  const inWarningPeriod = isTaskWarning();
  const isCompleted = task.status === 'Completed';

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
          accent: 'from-blue-500/10 to-blue-600/10'
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

  // Get left border color based on priority
  const getPriorityBorderColor = (priority: string) => {
    switch(priority) {
      case 'High': return 'border-l-red-500 dark:border-l-red-400';
      case 'Medium': return 'border-l-amber-500 dark:border-l-amber-400';
      case 'Low': return 'border-l-blue-500 dark:border-l-blue-400';
      default: return 'border-l-border';
    }
  };

  // Get static glow based on priority
  const getPriorityGlow = (priority: string) => {
    switch(priority) {
      case 'High': return 'shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30';
      case 'Medium': return 'shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30';
      case 'Low': return 'shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30';
      default: return 'shadow-lg hover:shadow-xl';
    }
  };

  return (
    <>
      <Card
        className={cn(
          "group relative cursor-pointer overflow-hidden",
          // List-style horizontal layout
          "flex flex-row items-center",
          "min-h-[100px] h-auto",
          // Left border for priority color (3px)
          "border-l-4",
          getPriorityBorderColor(task.priority),
          // Base border
          "border border-border/50 hover:border-border",
          // Static glow effects (NO PULSE)
          !isCompleted && !isOverdue && !inWarningPeriod && getPriorityGlow(task.priority),
          // Smooth transitions - removed scale/transform
          "transition-all duration-300 ease-out",
          // Simplified hover effect
          "hover:shadow-xl",
          // Background
          "bg-card/80 backdrop-blur-sm",
          // Completed state (green glow) - STATIC
          isCompleted && [
            "border-l-green-500 dark:border-l-green-400",
            "shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30",
            "bg-green-500/5"
          ],
          // Overdue state (red glow) - STATIC, NO PULSE
          !isCompleted && isOverdue && [
            "border-l-red-500 dark:border-l-red-400",
            "shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35",
            "bg-red-500/5"
          ],
          // Warning state (yellow glow) - STATIC, NO PULSE
          !isCompleted && !isOverdue && inWarningPeriod && [
            "border-l-yellow-500 dark:border-l-yellow-400",
            "shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/35",
            "bg-yellow-500/5"
          ]
        )}
        onClick={handleCardClick}
        tabIndex={0}
        aria-label={`Open details for ${task.title}`}
        role="button"
      >
        {/* Floating action menu */}
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="bg-background/95 backdrop-blur-md rounded-lg p-1 shadow-xl border border-border/50">
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

        {/* Main content - horizontal layout */}
        <div className="relative p-3 flex-1 z-10">          
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
