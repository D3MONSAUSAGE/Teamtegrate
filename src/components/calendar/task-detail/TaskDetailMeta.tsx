
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, AlertCircle } from "lucide-react";

interface TaskDetailMetaProps {
  deadline: Date | string;
  priority: string;
  assignedToName?: string;
  isOverdue: boolean;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
  getPriorityColor: (priority: string) => string;
}

const TaskDetailMeta: React.FC<TaskDetailMetaProps> = ({
  deadline,
  priority,
  assignedToName,
  isOverdue,
  formatDate,
  formatTime,
  getPriorityColor
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center">
        <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="text-sm">
          {formatDate(deadline)}
        </span>
      </div>
      
      <div className="flex items-center">
        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="text-sm">
          {formatTime(deadline)}
        </span>
      </div>
      
      <div>
        <Badge className={getPriorityColor(priority)}>
          {priority} Priority
        </Badge>
      </div>
      
      {isOverdue && (
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 text-rose-500" />
          <span className="text-sm text-rose-500 font-medium">
            Overdue
          </span>
        </div>
      )}
      
      {assignedToName && (
        <div className="col-span-2 text-sm">
          <span className="text-muted-foreground">Assigned to: </span>
          <span className="font-medium">{assignedToName}</span>
        </div>
      )}
    </div>
  );
};

export default TaskDetailMeta;
