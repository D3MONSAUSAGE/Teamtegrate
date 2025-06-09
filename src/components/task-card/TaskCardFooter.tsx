
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
        return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/25';
      case 'In Progress': 
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25';
      case 'Completed': 
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25';
      default: 
        return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/25';
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
        <SelectTrigger className="w-[140px] h-10 border-2 border-border/40 bg-card/80 backdrop-blur-sm rounded-xl hover:border-primary/40 transition-all duration-300">
          <SelectValue>
            <Badge className={cn("px-3 py-1.5 text-sm border-0 font-bold rounded-lg", getStatusColor(status))}>
              {status}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-2 border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl">
          <SelectItem value="To Do" className="rounded-lg">
            <Badge className="bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 px-3 py-1.5 text-sm font-bold">
              To Do
            </Badge>
          </SelectItem>
          <SelectItem value="In Progress" className="rounded-lg">
            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 px-3 py-1.5 text-sm font-bold">
              In Progress
            </Badge>
          </SelectItem>
          <SelectItem value="Completed" className="rounded-lg">
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 px-3 py-1.5 text-sm font-bold">
              Completed
            </Badge>
          </SelectItem>
        </SelectContent>
      </Select>

      {commentCount > 0 && (
        <button
          onClick={onShowComments}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all duration-300 p-2 rounded-lg hover:bg-primary/10 hover:scale-105"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="font-semibold">{commentCount}</span>
        </button>
      )}
    </div>
  );
};

export default TaskCardFooter;
