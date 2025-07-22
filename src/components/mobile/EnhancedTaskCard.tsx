
import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task } from '@/types';
import { Calendar, Clock, Edit3, CheckCircle, Circle, PlayCircle, Loader2, Flag } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

interface EnhancedTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onStatusChange: (taskId: string, status: string) => Promise<void>;
  onDelete: (taskId: string) => void;
  onClick: () => void;
  isUpdating?: boolean;
  index?: number;
}

const EnhancedTaskCard: React.FC<EnhancedTaskCardProps> = ({
  task,
  onEdit,
  onStatusChange,
  onDelete,
  onClick,
  isUpdating = false,
  index = 0
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [dragX, setDragX] = useState(0);

  const handleDragStart = () => {
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setDragX(info.offset.x);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 120;
    const minVelocity = 400;
    
    const isIntentionalSwipe = Math.abs(info.offset.x) > threshold && Math.abs(info.velocity.x) > minVelocity;
    const isHorizontalGesture = Math.abs(info.offset.x) > Math.abs(info.offset.y) * 1.5;
    
    if (isIntentionalSwipe && isHorizontalGesture) {
      setIsRevealed(true);
      if (navigator.vibrate) {
        navigator.vibrate([15, 10, 15]);
      }
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
      if (navigator.vibrate) {
        navigator.vibrate(25);
      }
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

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'High':
        return {
          gradient: 'from-red-400 to-orange-500',
          bg: 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20',
          badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          border: 'border-red-200 dark:border-red-800/50'
        };
      case 'Medium':
        return {
          gradient: 'from-yellow-400 to-amber-500',
          bg: 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20',
          badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
          border: 'border-yellow-200 dark:border-yellow-800/50'
        };
      case 'Low':
        return {
          gradient: 'from-green-400 to-emerald-500',
          bg: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
          badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          border: 'border-green-200 dark:border-green-800/50'
        };
      default:
        return {
          gradient: 'from-blue-400 to-cyan-500',
          bg: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          border: 'border-blue-200 dark:border-blue-800/50'
        };
    }
  };

  const formatDeadline = (deadline: Date | string) => {
    const date = deadline instanceof Date ? deadline : new Date(deadline);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd');
  };

  const isOverdue = isPast(new Date(task.deadline)) && task.status !== 'Completed';
  const priorityConfig = getPriorityConfig(task.priority);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Action buttons background */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        <div className="flex space-x-3">
          <Button
            size="sm"
            variant="ghost"
            className="h-12 w-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
            onClick={() => handleStatusChange('To Do')}
            disabled={isUpdating || task.status === 'To Do'}
          >
            <Circle className="h-5 w-5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-12 w-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
            onClick={() => handleStatusChange('In Progress')}
            disabled={isUpdating || task.status === 'In Progress'}
          >
            <PlayCircle className="h-5 w-5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
            onClick={() => handleStatusChange('Completed')}
            disabled={isUpdating || task.status === 'Completed'}
          >
            <CheckCircle className="h-5 w-5" />
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-12 w-12 rounded-full bg-purple-500 hover:bg-purple-600 text-white shadow-lg"
          onClick={() => onEdit(task)}
          disabled={isUpdating}
        >
          <Edit3 className="h-5 w-5" />
        </Button>
      </div>

      {/* Main card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: isRevealed ? (dragX > 0 ? 120 : -120) : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`
        }}
        className="relative z-10"
      >
        <Card 
          className={cn(
            "overflow-hidden border-2 transition-all duration-300 hover:shadow-xl active:scale-[0.98]",
            priorityConfig.bg,
            priorityConfig.border,
            isUpdating && "opacity-70 pointer-events-none",
            isOverdue && "ring-2 ring-red-400 ring-opacity-50"
          )}
          onClick={onClick}
        >
          {/* Priority indicator */}
          <div className={`h-1 bg-gradient-to-r ${priorityConfig.gradient}`} />
          
          <CardContent className="p-5">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base leading-6 text-foreground truncate">
                      {task.title}
                    </h3>
                    {task.priority === 'High' && (
                      <Flag className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-5">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.1 }}
                  >
                    {getStatusIcon()}
                  </motion.div>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center gap-1.5 text-sm",
                    isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
                  )}>
                    <Calendar className="h-4 w-4" />
                    <span>{formatDeadline(task.deadline)}</span>
                    {isOverdue && <span className="text-xs">(Overdue)</span>}
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs font-medium px-2.5 py-1", priorityConfig.badge)}
                >
                  {task.priority}
                </Badge>
              </div>

              {/* Assignment info */}
              {(task.assignedToName || task.assignedToNames?.length) && (
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                      {(task.assignedToName || task.assignedToNames?.[0] || '').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">
                      {task.assignedToNames?.length > 1 
                        ? `${task.assignedToNames[0]} +${task.assignedToNames.length - 1} more`
                        : task.assignedToName || task.assignedToNames?.[0]
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EnhancedTaskCard;
