import React from 'react';
import { Clock, User } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardMetadataProps {
  deadline: Date;
  assignedToName?: string;
  assignedToId?: string;
}

const TaskCardMetadata: React.FC<TaskCardMetadataProps> = ({
  deadline,
  assignedToName,
  assignedToId,
}) => {
  // Improved logic for display name
  const getDisplayName = () => {
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
  const isAssigned = assignedToId && assignedToId.trim() !== '';

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
