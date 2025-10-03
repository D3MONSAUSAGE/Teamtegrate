
import React, { useState, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Task, TaskStatus } from "@/types";
import TaskCardContent from './TaskCardContent';
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => Promise<void>;
  onDelete?: () => void;
  onClick?: () => void;
  className?: string;
  showProjectInfo?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  onStatusChange,
  onClick,
  className,
  showProjectInfo = true
}) => {
  const [commentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);

  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';
  const isCompleted = task.status === 'Completed';

  // Calculate if task is due soon (within 24 hours)
  const isDueSoon = () => {
    if (isCompleted || isOverdue) return false;
    const deadline = new Date(task.deadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDeadline <= 24 && hoursUntilDeadline > 0;
  };

  const handleStatusChange = useCallback(async (status: TaskStatus) => {
    if (onStatusChange) {
      await onStatusChange(task.id, status);
    }
  }, [onStatusChange, task.id]);

  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else if (onEdit) {
      onEdit(task);
    }
  }, [onClick, onEdit, task]);

  // Priority color configuration
  const getPriorityStyles = () => {
    if (isCompleted) {
      return {
        bar: 'bg-gradient-to-r from-emerald-500 to-green-500',
        glow: 'shadow-lg shadow-emerald-500/15',
        bgTint: 'bg-emerald-500/5'
      };
    }
    
    if (isOverdue) {
      return {
        bar: 'bg-gradient-to-r from-red-500 to-rose-500',
        glow: 'shadow-lg shadow-red-500/20',
        bgTint: 'bg-red-500/5'
      };
    }
    
    if (isDueSoon()) {
      return {
        bar: 'bg-gradient-to-r from-yellow-500 to-amber-500',
        glow: 'shadow-lg shadow-yellow-500/15',
        bgTint: 'bg-yellow-500/5'
      };
    }

    switch(task.priority) {
      case 'High':
        return {
          bar: 'bg-gradient-to-r from-red-500 to-rose-500',
          glow: 'shadow-lg shadow-red-500/15',
          bgTint: ''
        };
      case 'Medium':
        return {
          bar: 'bg-gradient-to-r from-amber-500 to-yellow-500',
          glow: 'shadow-lg shadow-amber-500/15',
          bgTint: ''
        };
      case 'Low':
        return {
          bar: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          glow: 'shadow-lg shadow-blue-500/15',
          bgTint: ''
        };
      default:
        return {
          bar: 'bg-gradient-to-r from-gray-400 to-gray-500',
          glow: 'shadow-lg shadow-gray-500/10',
          bgTint: ''
        };
    }
  };

  const priorityStyles = getPriorityStyles();

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden cursor-pointer",
        "min-h-[160px]",
        "border border-border/40",
        "bg-background/95 backdrop-blur-sm",
        priorityStyles.glow,
        priorityStyles.bgTint,
        "transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-0.5",
        "touch-manipulation",
        isCompleted && "opacity-75",
        className
      )}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Top Priority Color Bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        priorityStyles.bar
      )} />

      {/* Card Content */}
      <div className="p-5">
        <TaskCardContent 
          task={task}
          handleStatusChange={handleStatusChange}
          commentCount={commentCount}
          onShowComments={() => setShowComments(true)}
        />
      </div>
    </Card>
  );
};

export default TaskCard;
