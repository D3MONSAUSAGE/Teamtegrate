import React from 'react';
import { Clock, User } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardMetadataProps {
  deadline: Date;
  assignedToName?: string;
  assignedToId?: string;
  assignedToNames?: string[];
  assignedToIds?: string[];
}

const TaskCardMetadata: React.FC<TaskCardMetadataProps> = ({
  deadline,
  assignedToName,
  assignedToId,
  assignedToNames,
  assignedToIds,
}) => {
  // Improved logic for display name with multiple assignee support
  const getDisplayInfo = () => {
    // Handle multiple assignees first
    if (assignedToNames && assignedToNames.length > 0) {
      if (assignedToNames.length === 1) {
        return { displayName: assignedToNames[0], isAssigned: true };
      } else {
        return { displayName: `${assignedToNames[0]} +${assignedToNames.length - 1} more`, isAssigned: true };
      }
    }
    
    // Handle single assignee
    if (assignedToName && assignedToName.trim() !== '' && assignedToName !== assignedToId) {
      return { displayName: assignedToName, isAssigned: true };
    }
    
    // If we have an assignedToId but no proper name, show "Assigned User"
    if (assignedToId && assignedToId.trim() !== '') {
      return { displayName: 'Assigned User', isAssigned: true };
    }
    
    // Otherwise, truly unassigned
    return { displayName: 'Unassigned', isAssigned: false };
  };

  const { displayName, isAssigned } = getDisplayInfo();

  return (
    <div className="flex items-center justify-between pt-1 md:pt-2">
      <div className="flex items-center text-xs text-gray-500 gap-1">
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">
          {format(deadline, 'MMM d')} at {format(deadline, 'h:mm a')}
        </span>
      </div>
      
      <div className="flex items-center text-xs text-gray-500 gap-1">
        <User className="h-3 w-3 flex-shrink-0" />
        <span className={`truncate max-w-[100px] ${!isAssigned ? "italic text-gray-400" : ""}`}>
          {displayName}
        </span>
      </div>
    </div>
  );
};

export default TaskCardMetadata;
