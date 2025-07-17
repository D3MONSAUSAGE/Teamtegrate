
import React, { useState } from 'react';
import { MessageCircle, CheckCircle, Clock, Play, Sparkles } from 'lucide-react';
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
    
    setIsUpdating(true);
    
    try {
      await onStatusChange(newStatus);
    } catch (error) {
      console.error('❌ TaskCardFooter: Status change failed', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between pt-3 gap-3">
      {/* Enhanced Status Selector with modern styling */}
      <Select 
        value={status} 
        onValueChange={handleStatusChange}
        disabled={isUpdating}
      >
        <SelectTrigger className={cn(
          "w-[140px] h-9 border border-border/50 bg-gradient-to-r from-background/95 to-background/80 rounded-lg hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md",
          isUpdating && "opacity-50 cursor-not-allowed"
        )}>
          <SelectValue>
            <Badge className={cn(
              "px-3 py-1 text-xs font-medium rounded-md shadow-sm ring-1",
              "flex items-center gap-2 transition-all duration-300",
              statusConfig.color,
              statusConfig.shadowColor,
              statusConfig.ringColor,
              isUpdating && "animate-pulse"
            )}>
              <StatusIcon className="h-3.5 w-3.5 flex-shrink-0 drop-shadow-sm" />
              <span className="truncate tracking-wide">
                {isUpdating ? 'Updating...' : status}
              </span>
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-md border border-border/50 bg-background/98 shadow-md z-50 min-w-[160px]">
          <SelectItem value="To Do" className="rounded-md p-1 focus:bg-muted/80">
            <Badge className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-200 text-slate-800 dark:from-slate-900/60 dark:via-slate-800/70 dark:to-slate-700/60 dark:text-slate-200 border-slate-300/70 dark:border-slate-600/60 border px-3 py-1 text-xs font-medium flex items-center gap-2 shadow-sm ring-1 ring-slate-200/40 dark:ring-slate-700/40">
              <Clock className="h-3.5 w-3.5" />
              To Do
            </Badge>
          </SelectItem>
          <SelectItem value="In Progress" className="rounded-md p-1 focus:bg-muted/80">
            <Badge className="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/60 dark:via-blue-800/70 dark:to-blue-700/60 dark:text-blue-200 border-blue-300/70 dark:border-blue-600/60 border px-3 py-1 text-xs font-medium flex items-center gap-2 shadow-sm ring-1 ring-blue-200/40 dark:ring-blue-700/40">
              <Play className="h-3.5 w-3.5" />
              In Progress
            </Badge>
          </SelectItem>
          <SelectItem value="Completed" className="rounded-md p-1 focus:bg-muted/80">
            <Badge className="bg-gradient-to-r from-green-50 via-green-100 to-green-200 text-green-800 dark:from-green-900/60 dark:via-green-800/70 dark:to-green-700/60 dark:text-green-200 border-green-300/70 dark:border-green-600/60 border px-3 py-1 text-xs font-medium flex items-center gap-2 shadow-sm ring-1 ring-green-200/40 dark:ring-green-700/40">
              <CheckCircle className="h-3.5 w-3.5" />
              Completed
            </Badge>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Enhanced Comments Button */}
      {commentCount > 0 && (
        <button
          onClick={onShowComments}
          className={cn(
            "group flex items-center gap-2 px-3 py-1.5 rounded-lg",
            "bg-background/90",
            "border border-border/50 shadow-sm hover:shadow-md",
            "text-sm text-muted-foreground",
            "hover:text-primary hover:bg-primary/5",
            "hover:border-primary/30 hover:scale-105 active:scale-95",
            "transition-all duration-300"
          )}
        >
          <div className="relative">
            <MessageCircle className="h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
          </div>
          <span className="text-xs font-medium">
            {commentCount}
          </span>
          <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-300 text-primary" />
        </button>
      )}
    </div>
  );
};

export default TaskCardFooter;
