
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
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-muted/30 to-muted/20 border border-border/30">
        <div className="p-2 rounded-lg bg-primary/10">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
        <span className={cn(
          "text-sm font-semibold",
          isOverdue ? "text-red-600 dark:text-red-400" : "text-foreground"
        )}>
          {formatDeadline(deadline)}
        </span>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-muted/30 to-muted/20 border border-border/30">
        <div className="p-2 rounded-lg bg-accent/10">
          <User className="h-4 w-4 text-accent" />
        </div>
        <div className="text-sm min-w-0 flex-1">
          {hasMultipleAssignees ? (
            <TaskMultipleAssignees
              assignedToNames={assignedToNames}
              assignedToIds={assignedToIds}
              variant="card"
            />
          ) : hasSingleAssignee ? (
            <Badge variant="outline" className="text-sm px-3 py-1 bg-gradient-to-r from-secondary/50 to-secondary/30 border-border/50">
              {assignedToName}
            </Badge>
          ) : (
            <span className="text-muted-foreground italic font-medium">Unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCardMetadata;
