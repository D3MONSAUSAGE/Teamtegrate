
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
        return 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 shadow-sm';
      case 'In Progress': 
        return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm';
      case 'Completed': 
        return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm';
      default: 
        return 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 shadow-sm';
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
        <SelectTrigger className="w-[150px] h-9 bg-background/60 backdrop-blur-sm border-border/60 hover:bg-background/80 transition-all duration-200">
          <SelectValue>
            <Badge className={cn("px-3 py-1 text-white border-0", getStatusColor(status))}>
              {status}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background/95 backdrop-blur-xl border-border/60">
          <SelectItem value="To Do" className="focus:bg-muted/80">
            <Badge className="bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 px-3 py-1">
              To Do
            </Badge>
          </SelectItem>
          <SelectItem value="In Progress" className="focus:bg-muted/80">
            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 px-3 py-1">
              In Progress
            </Badge>
          </SelectItem>
          <SelectItem value="Completed" className="focus:bg-muted/80">
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 px-3 py-1">
              Completed
            </Badge>
          </SelectItem>
        </SelectContent>
      </Select>

      {commentCount > 0 && (
        <button
          onClick={onShowComments}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 p-2 rounded-lg hover:bg-muted/50"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="font-medium">{commentCount}</span>
        </button>
      )}
    </div>
  );
};

export default TaskCardFooter;
