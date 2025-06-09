
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
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
      case 'In Progress': 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'Completed': 
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      default: 
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
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
    <div className="flex items-center justify-between pt-2">
      <Select 
        value={status} 
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[130px] h-8 border-none bg-transparent p-0">
          <SelectValue>
            <Badge className={cn("px-2 py-1 text-xs border-none", getStatusColor(status))}>
              {status}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="To Do">
            <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-none px-2 py-1 text-xs">
              To Do
            </Badge>
          </SelectItem>
          <SelectItem value="In Progress">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 border-none px-2 py-1 text-xs">
              In Progress
            </Badge>
          </SelectItem>
          <SelectItem value="Completed">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200 border-none px-2 py-1 text-xs">
              Completed
            </Badge>
          </SelectItem>
        </SelectContent>
      </Select>

      {commentCount > 0 && (
        <button
          onClick={onShowComments}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 p-1 rounded"
        >
          <MessageCircle className="h-3 w-3" />
          <span>{commentCount}</span>
        </button>
      )}
    </div>
  );
};

export default TaskCardFooter;
