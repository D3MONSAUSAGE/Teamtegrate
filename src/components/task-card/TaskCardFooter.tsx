
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
      case 'To Do': return 'bg-slate-500 dark:bg-slate-600';
      case 'In Progress': return 'bg-blue-500 dark:bg-blue-600';
      case 'Completed': return 'bg-green-500 dark:bg-green-600';
      default: return 'bg-slate-500 dark:bg-slate-600';
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
        <SelectTrigger className="w-[140px] dark:bg-card">
          <SelectValue>
            <Badge className={cn("px-2 py-1", getStatusColor(status))}>
              {status}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="To Do">To Do</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="Completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      {commentCount > 0 && (
        <button
          onClick={onShowComments}
          className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <MessageCircle className="h-3 w-3" />
          {commentCount}
        </button>
      )}
    </div>
  );
};

export default TaskCardFooter;
