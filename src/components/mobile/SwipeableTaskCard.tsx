
import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task } from '@/types';
import { Calendar, Clock, Edit3, Trash2, CheckCircle, Circle, PlayCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SwipeableTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onStatusChange: (taskId: string, status: string) => Promise<void>;
  onDelete: (taskId: string) => void;
  onClick: () => void;
  isUpdating?: boolean;
}

const SwipeableTaskCard: React.FC<SwipeableTaskCardProps> = ({
  task,
  onEdit,
  onStatusChange,
  onDelete,
  onClick,
  isUpdating = false
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [dragX, setDragX] = useState(0);

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setDragX(info.offset.x);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      setIsRevealed(true);
    } else {
      setIsRevealed(false);
      setDragX(0);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (isUpdating) return;
    try {
      await onStatusChange(task.id, status);
      setIsRevealed(false);
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const getStatusIcon = () => {
    if (isUpdating) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    switch (task.status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'In Progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Action buttons background */}
      <div className="absolute inset-0 flex items-center justify-between px-4 bg-gradient-to-r from-blue-500 to-green-500">
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => handleStatusChange('To Do')}
            disabled={isUpdating || task.status === 'To Do'}
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => handleStatusChange('In Progress')}
            disabled={isUpdating || task.status === 'In Progress'}
          >
            <PlayCircle className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => handleStatusChange('Completed')}
            disabled={isUpdating || task.status === 'Completed'}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => onEdit(task)}
            disabled={isUpdating}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: isRevealed ? (dragX > 0 ? 100 : -100) : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10"
      >
        <Card 
          className={cn(
            "mobile-touch-target cursor-pointer transition-all duration-200 active:scale-[0.98]",
            isUpdating && "opacity-70 pointer-events-none"
          )}
          onClick={onClick}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm leading-5 text-card-foreground truncate">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  {getStatusIcon()}
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(task.deadline), 'MMM dd')}</span>
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs px-2 py-0.5", getPriorityColor(task.priority))}
                >
                  {task.priority}
                </Badge>
              </div>

              {/* Assignment info */}
              {(task.assignedToName || task.assignedToNames?.length) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Assigned to:</span>
                  <span className="font-medium">
                    {task.assignedToNames?.length > 1 
                      ? `${task.assignedToNames[0]} +${task.assignedToNames.length - 1} more`
                      : task.assignedToName || task.assignedToNames?.[0]
                    }
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SwipeableTaskCard;
