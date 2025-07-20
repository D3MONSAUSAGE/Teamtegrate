
import React, { useState, useRef } from 'react';
import { Check, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task, TaskStatus } from '@/types';
import TaskCard from '@/components/task-card/TaskCard';

interface SwipeAction {
  icon: React.ComponentType<any>;
  label: string;
  color: string;
  action: () => void;
}

interface SwipeableTaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => Promise<void>;
  onDelete?: () => void;
  onClick?: () => void;
}

const SwipeableTaskCard: React.FC<SwipeableTaskCardProps> = ({
  task,
  onEdit,
  onStatusChange,
  onDelete,
  onClick
}) => {
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isSwipping, setIsSwipping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const maxSwipe = 240;
  const threshold = 60;

  const leftActions: SwipeAction[] = [
    {
      icon: Check,
      label: 'Complete',
      color: 'bg-green-500',
      action: () => onStatusChange?.(task.id, 'Completed')
    }
  ];

  const rightActions: SwipeAction[] = [
    {
      icon: Edit,
      label: 'Edit',
      color: 'bg-blue-500',
      action: () => onEdit?.(task)
    },
    {
      icon: Trash2,
      label: 'Delete',
      color: 'bg-red-500',
      action: () => onDelete?.()
    }
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwipping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipping) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setSwipeDistance(clampedDiff);
  };

  const handleTouchEnd = () => {
    setIsSwipping(false);
    
    // Check if swipe threshold was met
    if (Math.abs(swipeDistance) >= threshold) {
      if (swipeDistance > 0 && leftActions[0]) {
        leftActions[0].action();
      } else if (swipeDistance < 0) {
        const actionIndex = Math.min(
          Math.floor(Math.abs(swipeDistance) / (maxSwipe / rightActions.length)),
          rightActions.length - 1
        );
        rightActions[actionIndex]?.action();
      }
    }
    
    // Reset position
    setSwipeDistance(0);
  };

  const progress = Math.abs(swipeDistance) / threshold;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Left action background */}
      {swipeDistance > 0 && (
        <div className="absolute inset-y-0 left-0 flex items-center justify-start pl-6">
          <div className={cn(
            "flex items-center gap-2 text-white font-medium transition-all duration-200",
            leftActions[0]?.color,
            "px-4 py-2 rounded-lg",
            progress > 1 ? "scale-110" : "scale-100"
          )}>
            <leftActions[0]?.icon className="h-5 w-5" />
            <span>{leftActions[0]?.label}</span>
          </div>
        </div>
      )}

      {/* Right actions background */}
      {swipeDistance < 0 && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-6 gap-3">
          {rightActions.map((action, index) => {
            const actionProgress = Math.max(0, (Math.abs(swipeDistance) - (index * (maxSwipe / rightActions.length))) / (maxSwipe / rightActions.length));
            return (
              <div
                key={action.label}
                className={cn(
                  "flex items-center gap-2 text-white font-medium transition-all duration-200",
                  action.color,
                  "px-4 py-2 rounded-lg",
                  actionProgress > 0.3 ? "scale-100 opacity-100" : "scale-50 opacity-50"
                )}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-sm">{action.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main card */}
      <div
        ref={cardRef}
        className="relative z-10 transition-transform duration-200 ease-out touch-manipulation"
        style={{
          transform: `translateX(${swipeDistance}px)`,
          transition: isSwipping ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <TaskCard
          task={task}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onClick={onClick}
        />
      </div>
    </div>
  );
};

export default SwipeableTaskCard;
