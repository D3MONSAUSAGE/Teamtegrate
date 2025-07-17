
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
          "flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md font-medium border",
          "shadow-sm backdrop-blur-sm transition-all duration-300",
          isOverdue 
            ? "bg-red-50/80 text-red-700 border-red-200/70 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60" 
            : "bg-muted/40 text-muted-foreground border-border/40 hover:border-border/60"
        )}>
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate font-medium">{formatDeadline(new Date(task.deadline))}</span>
        </div>

        {shouldShowCost && (
          <div className="flex items-center gap-2 text-xs backdrop-blur-sm shadow-sm
                          bg-green-50/80 text-green-700 dark:bg-green-950/60 dark:text-green-300 
                          px-2.5 py-1.5 rounded-md border border-green-200/70 dark:border-green-800/60 font-medium
                          transition-all duration-300 hover:border-green-300/70 dark:hover:border-green-700/60">
            <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate font-medium">{task.cost}</span>
          </div>
        )}
      </div>

      {/* Second row: Assignment and Project */}
      <div className="space-y-2">
        {(task.assignedToName || task.assignedToNames?.length) && (
          <div className="flex items-center gap-2 text-xs backdrop-blur-sm shadow-sm
                         bg-blue-50/80 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 
                         px-2.5 py-1.5 rounded-md border border-blue-200/70 dark:border-blue-800/60 font-medium
                         transition-all duration-300 hover:border-blue-300/70 dark:hover:border-blue-700/60">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate font-medium">
              {task.assignedToNames?.length > 1 
                ? `${task.assignedToNames[0]} +${task.assignedToNames.length - 1}`
                : task.assignedToName || task.assignedToNames?.[0] || "Assigned"
              }
            </span>
          </div>
        )}

        {projectName && (
          <div className="flex items-center gap-2 text-xs backdrop-blur-sm shadow-sm
                         bg-purple-50/80 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 
                         px-2.5 py-1.5 rounded-md border border-purple-200/70 dark:border-purple-800/60 font-medium
                         transition-all duration-300 hover:border-purple-300/70 dark:hover:border-purple-700/60">
            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate font-medium">{projectName}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCardMetadata;
