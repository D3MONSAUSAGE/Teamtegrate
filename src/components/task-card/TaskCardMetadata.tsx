
import React from "react";
import { format } from "date-fns";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TaskMultipleAssignees from "@/components/task/TaskMultipleAssignees";

interface TaskCardMetadataProps {
  deadline?: Date;
  assignedToName?: string;
  assignedToId?: string;
  assignedToNames?: string[];
  assignedToIds?: string[];
  isOverdue: boolean;
}

const TaskCardMetadata: React.FC<TaskCardMetadataProps> = ({
  deadline,
  assignedToName,
  assignedToId,
  assignedToNames,
  assignedToIds,
  isOverdue,
}) => {
  const hasAssignees = (assignedToNames && assignedToNames.length > 0) || assignedToName;
  
  return (
    <div className="space-y-3 text-sm">
      {/* Assignee Section - Now more prominent */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Assigned To
          </span>
          {!hasAssignees && (
            <Badge variant="outline" className="text-xs">
              Unassigned
            </Badge>
          )}
        </div>
        
        {hasAssignees && (
          <div className="pl-1">
            {assignedToNames && assignedToNames.length > 0 ? (
              <TaskMultipleAssignees
                assignedToNames={assignedToNames}
                assignedToIds={assignedToIds}
                variant="detail"
                maxDisplay={2}
              />
            ) : assignedToName ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {assignedToName.substring(0, 1).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium">{assignedToName}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Deadline Section */}
      {deadline && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Deadline
          </span>
          <div className={`flex items-center gap-2 pl-1 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
            {isOverdue ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            <span className={`text-sm ${isOverdue ? 'font-medium' : ''}`}>
              {format(deadline, "MMM dd, yyyy")}
            </span>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs ml-auto">
                Overdue
              </Badge>
            )}
          </div>
          
          {deadline && !isOverdue && (
            <div className="flex items-center gap-2 pl-6 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {format(deadline, "h:mm a")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCardMetadata;
