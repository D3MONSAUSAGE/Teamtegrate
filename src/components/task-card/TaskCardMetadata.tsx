
import React from "react";
import { Task } from "@/types";
import { Calendar, Clock, User, Building2 } from "lucide-react";
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
    <div className="space-y-2">
      {/* First row: Deadline and Assignment */}
      <div className="flex items-center justify-between gap-2">
        <div className={cn(
          "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors",
          isOverdue 
            ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300" 
            : "bg-muted/60 text-muted-foreground hover:bg-muted/80"
        )}>
          <Clock className="h-3 w-3" />
          <span className="font-medium">{formatDeadline(task.deadline)}</span>
        </div>

        {(task.assignedToName || task.assignedToNames?.length) && (
          <div className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 px-2 py-1 rounded-md">
            <User className="h-3 w-3" />
            <span className="font-medium truncate max-w-20">
              {task.assignedToNames?.length > 1 
                ? `${task.assignedToNames.length} people`
                : task.assignedToName || task.assignedToNames?.[0] || "Assigned"
              }
            </span>
          </div>
        )}
      </div>

      {/* Second row: Project info if available */}
      {projectName && (
        <div className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 dark:from-purple-950/50 dark:to-purple-900/50 dark:text-purple-300 px-2 py-1 rounded-md">
          <Building2 className="h-3 w-3" />
          <span className="font-medium truncate">{projectName}</span>
        </div>
      )}

      {/* Cost info - now always displayed */}
      <div className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-green-50 to-green-100 text-green-700 dark:from-green-950/50 dark:to-green-900/50 dark:text-green-300 px-2 py-1 rounded-md">
        <span className="font-medium">Cost: ${task.cost || 0}</span>
      </div>
    </div>
  );
};

export default TaskCardMetadata;
