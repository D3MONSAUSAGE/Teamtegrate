
import React from "react";
import { format } from "date-fns";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskAssignmentService } from "@/services/taskAssignmentService";
import TaskMultipleAssignees from "@/components/task/TaskMultipleAssignees";

interface TaskCardMetadataProps {
  task: any; // Using any to accommodate both Task types
  isOverdue: boolean;
}

const TaskCardMetadata: React.FC<TaskCardMetadataProps> = ({
  task,
  isOverdue,
}) => {
  const assignments = TaskAssignmentService.getTaskAssignments(task);
  const isAssigned = TaskAssignmentService.isTaskAssigned(task);
  const hasMultiple = TaskAssignmentService.hasMultipleAssignments(task);
  
  return (
    <div className="space-y-3 text-sm">
      {/* Assignee Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Assigned To
          </span>
          {!isAssigned && (
            <Badge variant="outline" className="text-xs">
              Unassigned
            </Badge>
          )}
        </div>
        
        {isAssigned && (
          <div className="pl-1">
            {hasMultiple ? (
              <TaskMultipleAssignees
                assignedToNames={assignments.assignedToNames}
                assignedToIds={assignments.assignedToIds}
                variant="detail"
                maxDisplay={2}
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {(assignments.assignedToName || 'U').substring(0, 1).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {assignments.assignedToName || 'Assigned User'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deadline Section */}
      {task.deadline && (
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
              {format(task.deadline, "MMM dd, yyyy")}
            </span>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs ml-auto">
                Overdue
              </Badge>
            )}
          </div>
          
          {task.deadline && !isOverdue && (
            <div className="flex items-center gap-2 pl-6 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {format(task.deadline, "h:mm a")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCardMetadata;
