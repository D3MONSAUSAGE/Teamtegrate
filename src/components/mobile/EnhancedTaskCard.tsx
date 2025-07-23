
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  User, 
  MessageSquare, 
  MoreVertical,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import TaskDetailDialog from '@/components/dialogs/TaskDetailDialog';
import CreateTaskDialog from '@/components/dialogs/CreateTaskDialog';
import CommentsDialog from '@/components/dialogs/CommentsDialog';

interface EnhancedTaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onSubmit?: (taskData: any) => Promise<void>;
  compact?: boolean;
}

const EnhancedTaskCard: React.FC<EnhancedTaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  onSubmit,
  compact = false
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';
  const commentsCount = task.comments?.length || 0;

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'To Do':
        return 'bg-muted text-muted-foreground';
      case 'In Progress':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
      case 'Completed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300';
      case 'low':
        return 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleEdit = (editTask: Task) => {
    setShowDetail(false);
    setShowEdit(true);
    onEdit?.(editTask);
  };

  const handleDelete = (taskId: string) => {
    setShowDetail(false);
    onDelete?.(taskId);
  };

  return (
    <>
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md border-border/50",
          compact ? "p-3" : "p-4"
        )}
        onClick={() => setShowDetail(true)}
      >
        <CardContent className="p-0">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-semibold line-clamp-2 text-foreground",
                  compact ? "text-sm" : "text-base"
                )}>
                  {task.title}
                </h3>
                {task.description && !compact && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetail(true);
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("text-xs font-medium", getStatusColor(task.status))}>
                {task.status === 'Completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {task.status}
              </Badge>
              
              <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                {task.priority}
              </Badge>
              
              {isOverdue && (
                <Badge className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>

            {/* Meta Information */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                {task.deadline && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(task.deadline), 'MMM dd')}</span>
                  </div>
                )}
                
                {task.userId && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-20">{task.userId}</span>
                  </div>
                )}
              </div>

              {commentsCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowComments(true);
                  }}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {commentsCount}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TaskDetailDialog
        open={showDetail}
        onOpenChange={setShowDetail}
        task={task}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CreateTaskDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        editingTask={task}
        onSubmit={onSubmit || (async () => {})}
      />

      <CommentsDialog
        open={showComments}
        onOpenChange={setShowComments}
        task={task}
      />
    </>
  );
};

export default EnhancedTaskCard;
