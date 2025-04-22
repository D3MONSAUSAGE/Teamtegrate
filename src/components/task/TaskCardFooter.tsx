
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { TaskStatus } from '@/types';
import { AlertCircle, CheckCircle2, MessageCircle, Clock } from 'lucide-react';

interface TaskCardFooterProps {
  status: TaskStatus;
  isOverdue: boolean;
  commentCount: number;
  onShowComments?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
}

const TaskCardFooter: React.FC<TaskCardFooterProps> = ({
  status,
  isOverdue,
  commentCount,
  onShowComments,
  onStatusChange,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'To Do': return 'bg-slate-100 hover:bg-slate-200 text-slate-700';
      case 'In Progress': return 'bg-blue-100 hover:bg-blue-200 text-blue-700';
      case 'Pending': return 'bg-amber-100 hover:bg-amber-200 text-amber-700';
      case 'Completed': return 'bg-green-100 hover:bg-green-200 text-green-700';
      default: return '';
    }
  };

  const handleMarkComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange('Completed');
    }
  };

  const handleShowComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShowComments) {
      onShowComments();
    }
  };

  return (
    <div className="flex flex-wrap justify-between items-center gap-2 mt-2">
      <Badge className={getStatusColor()}>
        {status}
      </Badge>

      <div className="flex items-center gap-2">
        {isOverdue && (
          <div className="flex items-center text-rose-500">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">Overdue</span>
          </div>
        )}

        {commentCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={handleShowComments}
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">{commentCount}</span>
          </Button>
        )}

        {status !== 'Completed' && onStatusChange && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={handleMarkComplete}
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}

        {status === 'In Progress' && (
          <div className="flex items-center text-blue-500">
            <Clock className="h-3.5 w-3.5 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCardFooter;
