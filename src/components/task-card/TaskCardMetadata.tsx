
import React from 'react';
import { Clock, User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

interface TaskCardMetadataProps {
  deadline: Date;
  assignedToName?: string;
  assignedToId?: string;
  assignedToNames?: string[];
  assignedToIds?: string[];
  isOverdue?: boolean;
}

const TaskCardMetadata: React.FC<TaskCardMetadataProps> = ({
  deadline,
  assignedToName,
  assignedToId,
  assignedToNames,
  assignedToIds,
  isOverdue = false,
}) => {
  // Handle multiple assignees
  const hasMultipleAssignees = assignedToIds && assignedToIds.length > 1;
  const hasAssignees = assignedToIds && assignedToIds.length > 0;

  // Improved logic for display name
  const getDisplayName = () => {
    if (hasMultipleAssignees) {
      return `${assignedToIds.length} members`;
    }
    
    // If we have a proper name that's not empty and not the same as the ID
    if (assignedToName && assignedToName.trim() !== '' && assignedToName !== assignedToId) {
      return assignedToName;
    }
    
    // If we have an assignedToId but no proper name, show "Assigned User"
    if (assignedToId && assignedToId.trim() !== '') {
      return 'Assigned User';
    }
    
    // Otherwise, truly unassigned
    return 'Unassigned';
  };

  const displayName = getDisplayName();

  return (
    <div className="flex items-center justify-between pt-3 gap-3">
      {/* Enhanced Deadline Badge */}
      <div className={cn(
        "flex items-center text-sm gap-2 px-3 py-2 rounded-xl backdrop-blur-sm flex-1 min-w-0",
        "border border-border/40 shadow-sm transition-all duration-200",
        "bg-gradient-to-r from-background/80 to-background/60",
        isOverdue ? [
          "bg-gradient-to-r from-red-50/90 to-red-100/70 dark:from-red-950/40 dark:to-red-900/30",
          "border-red-200/70 dark:border-red-800/50 text-red-700 dark:text-red-300",
          "shadow-red-100/50 dark:shadow-red-900/30"
        ] : "hover:bg-gradient-to-r hover:from-background/90 hover:to-background/70"
      )}>
        <Clock className={cn(
          "h-4 w-4 flex-shrink-0",
          isOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
        )} />
        <span className="font-medium whitespace-nowrap truncate">
          {format(deadline, 'MMM d')} at {format(deadline, 'h:mm a')}
        </span>
      </div>
      
      {/* Enhanced Assignee Badge */}
      <div className={cn(
        "flex items-center text-sm gap-2 px-3 py-2 rounded-xl backdrop-blur-sm flex-shrink-0",
        "border border-border/40 shadow-sm transition-all duration-200",
        "bg-gradient-to-r from-background/80 to-background/60",
        "hover:bg-gradient-to-r hover:from-background/90 hover:to-background/70",
        !hasAssignees && "opacity-75"
      )}>
        {hasMultipleAssignees ? (
          <Users className="h-4 w-4 flex-shrink-0 text-primary" />
        ) : (
          <User className={cn(
            "h-4 w-4 flex-shrink-0",
            hasAssignees ? "text-primary" : "text-muted-foreground"
          )} />
        )}
        <span className={cn(
          "truncate max-w-[100px] font-medium",
          hasAssignees ? "text-foreground" : "text-muted-foreground italic"
        )}>
          {displayName}
        </span>
      </div>
    </div>
  );
};

export default TaskCardMetadata;
