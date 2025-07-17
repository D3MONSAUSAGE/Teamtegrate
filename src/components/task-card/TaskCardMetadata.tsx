
import React from "react";
import { Task } from "@/types";
import { Calendar, Clock, User, Building2, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="grid grid-cols-1 gap-3">
      {/* First row: Deadline and Cost */}
      <div className="flex items-center justify-between gap-3">
        <div className={cn(
          "flex items-center gap-2 text-xs px-3 py-2 rounded-xl font-medium backdrop-blur-sm border shadow-sm transition-all duration-200",
          isOverdue 
            ? "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200 dark:from-red-950/50 dark:to-red-900/40 dark:text-red-300 dark:border-red-800/50 shadow-red-100/50" 
            : "bg-gradient-to-r from-muted/60 to-muted/40 text-muted-foreground border-border/40 hover:bg-muted/70 shadow-muted/20"
        )}>
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-semibold">{formatDeadline(task.deadline)}</span>
        </div>

        <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-green-50 to-green-100 text-green-700 dark:from-green-950/50 dark:to-green-900/40 dark:text-green-300 px-3 py-2 rounded-xl border border-green-200 dark:border-green-800/50 font-medium shadow-sm shadow-green-100/50 backdrop-blur-sm">
          <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-semibold">${task.cost || 0}</span>
        </div>
      </div>

      {/* Second row: Assignment and Project */}
      <div className="space-y-2">
        {(task.assignedToName || task.assignedToNames?.length) && (
          <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 dark:from-blue-950/50 dark:to-blue-900/40 dark:text-blue-300 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800/50 font-medium shadow-sm shadow-blue-100/50 backdrop-blur-sm">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-semibold truncate">
              {task.assignedToNames?.length > 1 
                ? `${task.assignedToNames[0]} +${task.assignedToNames.length - 1}`
                : task.assignedToName || task.assignedToNames?.[0] || "Assigned"
              }
            </span>
          </div>
        )}

        {projectName && (
          <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 dark:from-purple-950/50 dark:to-purple-900/40 dark:text-purple-300 px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800/50 font-medium shadow-sm shadow-purple-100/50 backdrop-blur-sm">
            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-semibold truncate">{projectName}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCardMetadata;
