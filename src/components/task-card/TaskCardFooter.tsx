
import React from 'react';
import { MessageCircle, CheckCircle, Clock, Play } from 'lucide-react';
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
  onStatusChange?: (status: TaskStatus) => void;
}

const TaskCardFooter: React.FC<TaskCardFooterProps> = ({
  status,
  isOverdue,
  commentCount,
  onShowComments,
  onStatusChange
}) => {
  const getStatusConfig = (status: TaskStatus) => {
    switch(status) {
      case 'To Do': 
        return {
          color: 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 dark:from-slate-900/50 dark:to-slate-800/50 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60',
          icon: Clock,
          shadowColor: 'shadow-slate-200/40 dark:shadow-slate-900/30'
        };
      case 'In Progress': 
        return {
          color: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 dark:from-blue-900/50 dark:to-blue-800/50 dark:text-blue-300 border-blue-200/60 dark:border-blue-700/60',
          icon: Play,
          shadowColor: 'shadow-blue-200/40 dark:shadow-blue-900/30'
        };
      case 'Completed': 
        return {
          color: 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 dark:from-green-900/50 dark:to-green-800/50 dark:text-green-300 border-green-200/60 dark:border-green-700/60',
          icon: CheckCircle,
          shadowColor: 'shadow-green-200/40 dark:shadow-green-900/30'
        };
      default: 
        return {
          color: 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 dark:from-slate-900/50 dark:to-slate-800/50 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60',
          icon: Clock,
          shadowColor: 'shadow-slate-200/40 dark:shadow-slate-900/30'
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (onStatusChange) {
      console.log(`TaskCardFooter: Changing status to ${newStatus}`);
      onStatusChange(newStatus);
    } else {
      console.warn("No status change handler provided to TaskCardFooter");
    }
  };

  return (
    <div className="flex items-center justify-between pt-2 gap-2">
      {/* Enhanced Status Selector - Reduced width */}
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[130px] h-10 border-2 border-border/40 bg-gradient-to-r from-background/90 to-background/70 backdrop-blur-sm rounded-xl hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow-md">
          <SelectValue>
            <Badge className={cn(
              "px-2.5 py-1 text-xs border-2 font-semibold rounded-lg shadow-sm",
              "flex items-center gap-1.5 transition-all duration-200",
              statusConfig.color,
              statusConfig.shadowColor
            )}>
              <StatusIcon className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{status}</span>
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-2 border-border/40 bg-background/95 backdrop-blur-xl shadow-xl z-50">
          <SelectItem value="To Do" className="rounded-lg">
            <Badge className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 dark:from-slate-900/50 dark:to-slate-800/50 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 border-2 px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              To Do
            </Badge>
          </SelectItem>
          <SelectItem value="In Progress" className="rounded-lg">
            <Badge className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 dark:from-blue-900/50 dark:to-blue-800/50 dark:text-blue-300 border-blue-200/60 dark:border-blue-700/60 border-2 px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5">
              <Play className="h-3 w-3" />
              In Progress
            </Badge>
          </SelectItem>
          <SelectItem value="Completed" className="rounded-lg">
            <Badge className="bg-gradient-to-r from-green-50 to-green-100 text-green-700 dark:from-green-900/50 dark:to-green-800/50 dark:text-green-300 border-green-200/60 dark:border-green-700/60 border-2 px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3" />
              Completed
            </Badge>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Enhanced Comments Button - Better spacing */}
      {commentCount > 0 && (
        <button
          onClick={onShowComments}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm flex-shrink-0",
            "bg-gradient-to-r from-background/80 to-background/60",
            "border border-border/40 shadow-sm",
            "text-sm font-medium text-muted-foreground",
            "hover:text-primary hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10",
            "hover:border-primary/30 hover:shadow-md hover:scale-105",
            "transition-all duration-200"
          )}
        >
          <MessageCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs font-semibold">{commentCount}</span>
        </button>
      )}
    </div>
  );
};

export default TaskCardFooter;
