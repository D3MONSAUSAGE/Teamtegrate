
import React from "react";
import { format } from "date-fns";
import { Calendar, Clock, AlertTriangle, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskAssignmentService } from "@/services/taskAssignmentService";
import TaskMultipleAssignees from "@/components/task/TaskMultipleAssignees";
import { cn } from "@/lib/utils";

interface TaskCardMetadataProps {
  task: any;
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
    <div className="space-y-4 text-sm">
      {/* Enhanced Assignee Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-gradient-to-r from-primary/10 to-primary/5 rounded-md">
              {hasMultiple ? <Users className="h-3 w-3 text-primary" /> : <User className="h-3 w-3 text-primary" />}
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Assigned To
            </span>
          </div>
          {!isAssigned && (
            <Badge variant="outline" className="text-xs bg-muted/30 border-border/40">
              Unassigned
            </Badge>
          )}
        </div>
        
        {isAssigned && (
          <div className="pl-2">
            {hasMultiple ? (
              <TaskMultipleAssignees
                assignedToNames={assignments.assignedToNames}
                assignedToIds={assignments.assignedToIds}
                variant="detail"
                maxDisplay={2}
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-full flex items-center justify-center ring-2 ring-primary/20 shadow-sm">
                  <span className="text-xs font-bold text-primary">
                    {(assignments.assignedToName || 'U').substring(0, 1).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground">
                    {assignments.assignedToName || 'Assigned User'}
                  </span>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-primary/40 to-transparent rounded-full mt-0.5" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Deadline Section */}
      {task.deadline && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1 rounded-md transition-colors duration-200",
              isOverdue ? "bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20" : "bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20"
            )}>
              {isOverdue ? (
                <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
              ) : (
                <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Deadline
            </span>
          </div>
          
          <div className="pl-2 space-y-2">
            <div className={cn(
              "flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
              isOverdue 
                ? "bg-gradient-to-r from-red-50/80 to-red-100/60 dark:from-red-950/40 dark:to-red-900/30 border-red-200/60 dark:border-red-800/40" 
                : "bg-gradient-to-r from-blue-50/80 to-blue-100/60 dark:from-blue-950/40 dark:to-blue-900/30 border-blue-200/60 dark:border-blue-800/40"
            )}>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-semibold",
                  isOverdue ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"
                )}>
                  {format(task.deadline, "MMM dd, yyyy")}
                </span>
              </div>
              
              {isOverdue && (
                <Badge variant="destructive" className="text-xs font-semibold shadow-sm animate-pulse">
                  Overdue
                </Badge>
              )}
            </div>
            
            {task.deadline && !isOverdue && (
              <div className="flex items-center gap-2 pl-3 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{format(task.deadline, "h:mm a")}</span>
                <div className="flex-1 h-px bg-gradient-to-r from-border/40 to-transparent" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCardMetadata;
