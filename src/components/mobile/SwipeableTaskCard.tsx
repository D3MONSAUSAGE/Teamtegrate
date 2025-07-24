
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
    <div className="relative overflow-hidden rounded-2xl shadow-sm">
      {/* Enhanced Action buttons background with better gradients */}
      <div className="absolute inset-0 flex items-center justify-between px-6 bg-gradient-to-r from-blue-500/90 via-indigo-500/90 to-green-500/90 backdrop-blur-sm">
        <div className="flex space-x-3">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/25 active:scale-95 transition-all duration-200 h-10 w-10 rounded-xl"
            onClick={() => handleStatusChange('To Do')}
            disabled={isUpdating || task.status === 'To Do'}
          >
            <Circle className="h-5 w-5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/25 active:scale-95 transition-all duration-200 h-10 w-10 rounded-xl"
            onClick={() => handleStatusChange('In Progress')}
            disabled={isUpdating || task.status === 'In Progress'}
          >
            <PlayCircle className="h-5 w-5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/25 active:scale-95 transition-all duration-200 h-10 w-10 rounded-xl"
            onClick={() => handleStatusChange('Completed')}
            disabled={isUpdating || task.status === 'Completed'}
          >
            <CheckCircle className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex space-x-3">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/25 active:scale-95 transition-all duration-200 h-10 w-10 rounded-xl"
            onClick={() => onEdit(task)}
            disabled={isUpdating}
          >
            <Edit3 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Enhanced Main card with better animations */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={0.15}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: isRevealed ? (dragX > 0 ? 120 : -120) : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="relative z-10"
      >
        <Card 
          className={cn(
            "cursor-pointer transition-all duration-300 active:scale-[0.97] shadow-md hover:shadow-lg",
            "bg-gradient-to-br from-card/98 to-card/95 backdrop-blur-sm",
            "border border-border/60 rounded-2xl overflow-hidden",
            "min-h-[120px]",
            isUpdating && "opacity-70 pointer-events-none"
          )}
          onClick={onClick}
        >
          <CardContent className="p-5">
            <div className="space-y-4">
              {/* Enhanced Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base leading-6 text-card-foreground truncate mb-1">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-muted-foreground leading-5 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <div className="p-2 rounded-xl bg-muted/50">
                    {getStatusIcon()}
                  </div>
                </div>
              </div>

              {/* Enhanced Metadata with better spacing */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="p-1.5 rounded-lg bg-muted/30">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{format(new Date(task.deadline), 'MMM dd')}</span>
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-sm px-3 py-1.5 rounded-xl font-medium shadow-sm", 
                    getPriorityColor(task.priority)
                  )}
                >
                  {task.priority}
                </Badge>
              </div>

              {/* Enhanced Assignment info */}
              {(task.assignedToName || task.assignedToNames?.length) && (
                <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-xl border border-border/30">
                  <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                  <span className="text-sm text-muted-foreground">Assigned to:</span>
                  <span className="text-sm font-semibold text-foreground">
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
