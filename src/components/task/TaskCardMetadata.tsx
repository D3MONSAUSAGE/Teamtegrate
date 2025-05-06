
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
  // Only show as unassigned if there's no assignedToId
  // This ensures tasks with IDs but pending names still show as assigned
  const isUnassigned = !assignedToId;
  
  // Format the display name - if empty or undefined, show "Unassigned"
  const displayName = !isUnassigned && assignedToName && assignedToName.trim() !== '' 
    ? assignedToName 
    : isUnassigned ? 'Unassigned' : 'Loading user...';

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
        <span className="truncate max-w-[100px]" title={displayName}>{displayName}</span>
      </div>
    </div>
  );
};

export default TaskCardMetadata;
