
import React from "react";
import { Task } from "@/types";
import { Calendar, Clock, User, Building2, DollarSign } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useTaskSafe } from "@/hooks/useTaskSafe";

interface TaskCardMetadataProps {
  task: Task;
  isOverdue: boolean;
}

const TaskCardMetadata: React.FC<TaskCardMetadataProps> = ({ task, isOverdue }) => {
  const taskContext = useTaskSafe();
  const projects = taskContext?.projects || [];
  
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
  const shouldShowCost = task.cost !== null && task.cost !== undefined && task.cost > 0;

  return (
    <div className="space-y-2.5">
      {/* Pill Row: Deadline and Cost */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Deadline Pill */}
        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
          "border shadow-sm transition-all duration-300",
          isOverdue 
            ? "bg-red-50/80 text-red-700 border-red-200/70 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60" 
            : "bg-muted/60 text-muted-foreground border-border/40"
        )}>
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-medium">{formatDeadline(new Date(task.deadline))}</span>
        </div>

        {/* Cost Pill */}
        {shouldShowCost && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                          bg-emerald-50/80 text-emerald-700 border border-emerald-200/70 
                          dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60
                          shadow-sm transition-all duration-300">
            <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium">{task.cost}</span>
          </div>
        )}
      </div>

      {/* Secondary Info Row: Assignee and Project */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {(task.assignedToName || task.assignedToNames?.length) && (
          <div className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium">
              {task.assignedToNames?.length > 1 
                ? `${task.assignedToNames[0]} +${task.assignedToNames.length - 1}`
                : task.assignedToName || task.assignedToNames?.[0] || "Assigned"
              }
            </span>
          </div>
        )}

        {projectName && (
          <>
            {(task.assignedToName || task.assignedToNames?.length) && (
              <span className="text-border">•</span>
            )}
            <div className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-medium truncate">{projectName}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskCardMetadata;
