
import React from 'react';
import { MessageCircle } from 'lucide-react';
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
  const getStatusColor = (status: TaskStatus) => {
    switch(status) {
      case 'To Do': 
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
      case 'In Progress': 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700';
      case 'Completed': 
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
      default: 
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (onStatusChange) {
      console.log(`TaskCardFooter: Changing status to ${newStatus}`);
      onStatusChange(newStatus);
    } else {
      console.warn("No status change handler provided to TaskCardFooter");
    }
  };

  return (
    <div className="flex items-center justify-between pt-1">
      <Select 
        value={status} 
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[130px] h-8 border border-border/40 bg-card/80 backdrop-blur-sm rounded-lg hover:border-primary/40 transition-all duration-200">
          <SelectValue>
            <Badge className={cn("px-2 py-1 text-xs border font-medium rounded-md", getStatusColor(status))}>
              {status}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-lg border border-border/40 bg-card/95 backdrop-blur-xl shadow-lg">
          <SelectItem value="To Do" className="rounded-md">
            <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 border px-2 py-1 text-xs font-medium">
              To Do
            </Badge>
          </SelectItem>
          <SelectItem value="In Progress" className="rounded-md">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700 border px-2 py-1 text-xs font-medium">
              In Progress
            </Badge>
          </SelectItem>
          <SelectItem value="Completed" className="rounded-md">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200 border-green-200 dark:border-green-700 border px-2 py-1 text-xs font-medium">
              Completed
            </Badge>
          </SelectItem>
        </SelectContent>
      </Select>

      {commentCount > 0 && (
        <button
          onClick={onShowComments}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-all duration-200 p-1.5 rounded-md hover:bg-primary/10 hover:scale-105"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="font-medium">{commentCount}</span>
        </button>
      )}
    </div>
  );
};

export default TaskCardFooter;
