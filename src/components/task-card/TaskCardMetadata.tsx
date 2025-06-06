
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import TaskMultipleAssignees from "@/components/task/TaskMultipleAssignees";

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
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span className={isOverdue ? "text-red-600 font-medium" : ""}>
            {formatDeadline(deadline)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs">
          {hasMultipleAssignees ? (
            <TaskMultipleAssignees
              assignedToNames={assignedToNames}
              assignedToIds={assignedToIds}
              variant="card"
            />
          ) : hasSingleAssignee ? (
            <Badge variant="outline" className="text-xs px-2 py-1">
              {assignedToName}
            </Badge>
          ) : (
            <span className="text-gray-500">Unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCardMetadata;
