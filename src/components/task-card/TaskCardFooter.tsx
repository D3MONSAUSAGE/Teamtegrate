
import React, { useState } from 'react';
import { MessageCircle, CheckCircle, Clock, Play, Sparkles, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { TaskStatus } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';

interface TaskCardFooterProps {
  status: TaskStatus;
  isOverdue: boolean;
  commentCount: number;
  onShowComments: () => void;
  onStatusChange?: (status: TaskStatus) => Promise<void>;
}

const TaskCardFooter: React.FC<TaskCardFooterProps> = ({
  status,
  isOverdue,
  commentCount,
  onShowComments,
  onStatusChange
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusConfig = (status: TaskStatus) => {
    switch(status) {
      case 'To Do': 
        return {
          color: 'bg-gradient-to-r from-slate-50 via-slate-100 to-slate-200 text-slate-800 dark:from-slate-900/60 dark:via-slate-800/70 dark:to-slate-700/60 dark:text-slate-200 border-slate-300/70 dark:border-slate-600/60',
          icon: Clock,
          shadowColor: 'shadow-slate-300/50 dark:shadow-slate-900/40',
          ringColor: 'ring-slate-200/40 dark:ring-slate-700/40'
        };
      case 'In Progress': 
        return {
          color: 'bg-gradient-to-r from-blue-50 via-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/60 dark:via-blue-800/70 dark:to-blue-700/60 dark:text-blue-200 border-blue-300/70 dark:border-blue-600/60',
          icon: Play,
          shadowColor: 'shadow-blue-300/50 dark:shadow-blue-900/40',
          ringColor: 'ring-blue-200/40 dark:ring-blue-700/40'
        };
      case 'Completed': 
        return {
          color: 'bg-gradient-to-r from-green-50 via-green-100 to-green-200 text-green-800 dark:from-green-900/60 dark:via-green-800/70 dark:to-green-700/60 dark:text-green-200 border-green-300/70 dark:border-green-600/60',
          icon: CheckCircle,
          shadowColor: 'shadow-green-300/50 dark:shadow-green-900/40',
          ringColor: 'ring-green-200/40 dark:ring-green-700/40'
        };
      default: 
        return {
          color: 'bg-gradient-to-r from-slate-50 via-slate-100 to-slate-200 text-slate-800 dark:from-slate-900/60 dark:via-slate-800/70 dark:to-slate-700/60 dark:text-slate-200 border-slate-300/70 dark:border-slate-600/60',
          icon: Clock,
          shadowColor: 'shadow-slate-300/50 dark:shadow-slate-900/40',
          ringColor: 'ring-slate-200/40 dark:ring-slate-700/40'
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!onStatusChange || isUpdating) {
      return;
    }

    console.log('🎯 TaskCardFooter: Status change requested', { from: status, to: newStatus });
    
    setIsUpdating(true);
    
    try {
      await onStatusChange(newStatus);
      console.log('✅ TaskCardFooter: Status change successful');
    } catch (error) {
      console.error('❌ TaskCardFooter: Status change failed', error);
      toast.error('Failed to update task status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Compact Status Badge */}
      <Select 
        value={status} 
        onValueChange={handleStatusChange}
        disabled={isUpdating}
      >
        <SelectTrigger className={cn(
          "w-[100px] h-7 border border-border/50 bg-background/80 rounded-lg hover:border-primary/50 transition-all duration-300",
          isUpdating && "opacity-50 cursor-not-allowed"
        )}>
          <SelectValue>
            <Badge className={cn(
              "px-2 py-0.5 text-[10px] border font-medium rounded-md flex items-center gap-1.5",
              statusConfig.color,
              isUpdating && "animate-pulse"
            )}>
              <StatusIcon className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{isUpdating ? 'Updating...' : status}</span>
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-lg border border-border/50 bg-background/98 backdrop-blur-xl shadow-xl z-50 min-w-[120px]">
          <SelectItem value="To Do" className="rounded-md p-2 focus:bg-muted/80">
            <Badge className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-200 text-slate-800 dark:from-slate-900/60 dark:via-slate-800/70 dark:to-slate-700/60 dark:text-slate-200 border-slate-300/70 dark:border-slate-600/60 border px-2 py-0.5 text-[10px] font-medium flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              To Do
            </Badge>
          </SelectItem>
          <SelectItem value="In Progress" className="rounded-md p-2 focus:bg-muted/80">
            <Badge className="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/60 dark:via-blue-800/70 dark:to-blue-700/60 dark:text-blue-200 border-blue-300/70 dark:border-blue-600/60 border px-2 py-0.5 text-[10px] font-medium flex items-center gap-1.5">
              <Play className="h-3 w-3" />
              In Progress
            </Badge>
          </SelectItem>
          <SelectItem value="Completed" className="rounded-md p-2 focus:bg-muted/80">
            <Badge className="bg-gradient-to-r from-green-50 via-green-100 to-green-200 text-green-800 dark:from-green-900/60 dark:via-green-800/70 dark:to-green-700/60 dark:text-green-200 border-green-300/70 dark:border-green-600/60 border px-2 py-0.5 text-[10px] font-medium flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3" />
              Completed
            </Badge>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Compact Comments Badge */}
      {commentCount > 0 && (
        <button
          onClick={onShowComments}
          className={cn(
            "flex items-center gap-1 px-2 h-7 rounded-lg",
            "bg-background/80 border border-border/50",
            "text-xs font-medium text-muted-foreground",
            "hover:text-primary hover:border-primary/40",
            "transition-all duration-300"
          )}
        >
          <MessageCircle className="h-3 w-3" />
          <span>{commentCount}</span>
        </button>
      )}

      {/* Compact Overdue Badge - NO PULSE */}
      {isOverdue && (
        <div className={cn(
          "flex items-center gap-1 h-7 px-2 rounded-lg",
          "bg-red-500 text-white text-[10px] font-medium"
        )}>
          <AlertCircle className="w-3 h-3" />
          <span>Overdue</span>
        </div>
      )}
    </div>
  );
};

export default TaskCardFooter;
