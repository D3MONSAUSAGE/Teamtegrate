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
    <div className="flex items-center justify-between pt-2 gap-2">
      <div className={cn(
        "flex items-center text-xs gap-1.5 px-2 py-1 rounded-md",
        "bg-muted/50 border border-border/30",
        isOverdue && "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300"
      )}>
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="truncate font-medium">
          {format(deadline, 'MMM d')} at {format(deadline, 'h:mm a')}
        </span>
      </div>
      
      <div className={cn(
        "flex items-center text-xs gap-1.5 px-2 py-1 rounded-md",
        "bg-muted/50 border border-border/30",
        !hasAssignees && "italic opacity-75"
      )}>
        {hasMultipleAssignees ? (
          <Users className="h-3 w-3 flex-shrink-0" />
        ) : (
          <User className="h-3 w-3 flex-shrink-0" />
        )}
        <span className="truncate max-w-[100px] font-medium">
          {displayName}
        </span>
      </div>
    </div>
  );
};

export default TaskCardMetadata;
