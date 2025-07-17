
import React from "react";
import { Task } from "@/types";
import { Calendar, Clock, User, Building2, DollarSign } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useTask } from "@/contexts/task";

interface TaskCardMetadataProps {
  task: Task;
  isOverdue: boolean;
}

const TaskCardMetadata: React.FC<TaskCardMetadataProps> = ({ task, isOverdue }) => {
  const { projects } = useTask();
  
  const formatDeadline = (deadline: Date) => {
    const now = new Date();
    const diffDays = differenceInDays(deadline, now);
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    
    return format(deadline, "MMM d");
  };

  const getProjectName = () => {
    if (!task.projectId) return null;
    const project = projects.find(p => p.id === task.projectId);
    return project?.title || "Unknown Project";
  };

  const projectName = getProjectName();
  // Only show cost box when cost is defined AND greater than 0
  const shouldShowCost = task.cost !== null && task.cost !== undefined && task.cost > 0;

  return (
    <div className="space-y-3">
      {/* First row: Deadline and Cost */}
      <div className="grid grid-cols-2 gap-2">
        <div className={cn(
          "flex items-center gap-2 text-xs px-2 py-1.5 rounded-md font-medium border",
          isOverdue 
            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/50" 
            : "bg-muted/50 text-muted-foreground border-border/50"
        )}>
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span className="truncate font-medium">{formatDeadline(task.deadline)}</span>
        </div>

        {shouldShowCost && (
          <div className="flex items-center gap-2 text-xs bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300 px-2 py-1.5 rounded-md border border-green-200 dark:border-green-800/50 font-medium">
            <DollarSign className="h-3 w-3 flex-shrink-0" />
            <span className="truncate font-medium">{task.cost}</span>
          </div>
        )}
      </div>

      {/* Second row: Assignment and Project */}
      <div className="space-y-2">
        {(task.assignedToName || task.assignedToNames?.length) && (
          <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 px-2 py-1.5 rounded-md border border-blue-200 dark:border-blue-800/50 font-medium">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate font-medium">
              {task.assignedToNames?.length > 1 
                ? `${task.assignedToNames[0]} +${task.assignedToNames.length - 1}`
                : task.assignedToName || task.assignedToNames?.[0] || "Assigned"
              }
            </span>
          </div>
        )}

        {projectName && (
          <div className="flex items-center gap-2 text-xs bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 px-2 py-1.5 rounded-md border border-purple-200 dark:border-purple-800/50 font-medium">
            <Building2 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate font-medium">{projectName}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCardMetadata;
