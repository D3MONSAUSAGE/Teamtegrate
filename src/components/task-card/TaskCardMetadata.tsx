
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import TaskMultipleAssignees from "@/components/task/TaskMultipleAssignees";
import { cn } from "@/lib/utils";

interface TaskCardMetadataProps {
  deadline: Date;
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
  const formatDeadline = (deadline: Date) => {
    if (isToday(deadline)) {
      return "Today";
    } else if (isTomorrow(deadline)) {
      return "Tomorrow";
    } else {
      return format(deadline, "MMM dd");
    }
  };

  // Use multiple assignees if available, otherwise fall back to single assignee
  const hasMultipleAssignees = assignedToNames && assignedToNames.length > 0;
  const hasSingleAssignee = assignedToName && !hasMultipleAssignees;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-muted/50">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className={cn(
            "text-sm font-medium",
            isOverdue ? "text-red-600 dark:text-red-400" : "text-foreground"
          )}>
            {formatDeadline(deadline)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-muted/50">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="text-sm min-w-0 flex-1">
          {hasMultipleAssignees ? (
            <TaskMultipleAssignees
              assignedToNames={assignedToNames}
              assignedToIds={assignedToIds}
              variant="card"
            />
          ) : hasSingleAssignee ? (
            <Badge variant="outline" className="text-xs px-2 py-1 bg-background/50">
              {assignedToName}
            </Badge>
          ) : (
            <span className="text-muted-foreground italic">Unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCardMetadata;
