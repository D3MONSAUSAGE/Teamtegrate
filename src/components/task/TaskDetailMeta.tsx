
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, AlertCircle } from "lucide-react";

interface TaskDetailMetaProps {
  deadline: Date | string;
  status: string;
  priority: string;
  assignedTo: string;
  assignedToId?: string;
  isOverdue: () => boolean;
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
}

const TaskDetailMeta: React.FC<TaskDetailMetaProps> = ({
  deadline,
  status,
  priority,
  assignedTo,
  assignedToId,
  isOverdue,
  getPriorityColor,
  formatDate,
  formatTime,
}) => (
  <div className="p-4">
    <div className="grid grid-cols-2 gap-3 mb-2">
      <div className="flex items-center">
        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="text-sm">{formatDate(deadline)}</span>
      </div>
      <div className="flex items-center">
        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="text-sm">{formatTime(deadline)}</span>
      </div>
      <div>
        <Badge className={getPriorityColor(priority)}>{priority} Priority</Badge>
      </div>
      {isOverdue() && (
        <div className="flex items-center">
          <AlertCircle className="mr-2 h-4 w-4 text-rose-500" />
          <span className="text-sm text-rose-500 font-medium">Overdue</span>
        </div>
      )}
      <div className="col-span-2 text-sm flex items-center mt-2">
        <User className="h-4 w-4 mr-1 text-muted-foreground" />
        <span className="text-muted-foreground pr-1">Assigned to:</span>
        <span className={`font-medium ${!assignedToId ? 'italic text-gray-400' : ''}`}>
          {assignedTo}
        </span>
      </div>
    </div>
    <Separator className="my-4" />
  </div>
);

export default TaskDetailMeta;
