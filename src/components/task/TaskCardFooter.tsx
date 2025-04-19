
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface TaskCardFooterProps {
  status: string;
  isOverdue: boolean;
  commentCount: number;
  onShowComments: () => void;
}

const TaskCardFooter: React.FC<TaskCardFooterProps> = ({
  status,
  isOverdue,
  commentCount,
  onShowComments,
}) => {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'To Do': return 'status-todo';
      case 'In Progress': return 'status-inprogress';
      case 'Pending': return 'status-pending';
      case 'Completed': return 'status-completed';
      default: return 'status-todo';
    }
  };

  return (
    <div className="pt-1 md:pt-2 flex justify-between items-center">
      <div className="flex flex-wrap gap-1">
        <Badge className={cn(getStatusColor(status), "text-xs md:text-sm")}>
          {status}
        </Badge>
        {isOverdue && (
          <Badge variant="destructive" className="ml-1 text-xs md:text-sm">
            Overdue
          </Badge>
        )}
      </div>
      
      {commentCount > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1 h-6 px-2 py-0"
          onClick={onShowComments}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="text-xs">{commentCount}</span>
        </Button>
      )}
    </div>
  );
};

export default TaskCardFooter;
