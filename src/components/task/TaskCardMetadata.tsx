
import React from 'react';
import { Clock, User } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardMetadataProps {
  deadline: Date;
  assignedToName?: string;
}

const TaskCardMetadata: React.FC<TaskCardMetadataProps> = ({
  deadline,
  assignedToName,
}) => {
  // Format the display name to handle the case where assignedToName is an ID
  const displayName = assignedToName 
    ? (assignedToName.includes('-') && assignedToName.length > 20) 
      ? 'Unassigned' 
      : assignedToName
    : null;

  return (
    <div className="flex items-center justify-between pt-1 md:pt-2">
      <div className="flex items-center text-xs text-gray-500 gap-1">
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">
          {format(deadline, 'MMM d')} at {format(deadline, 'h:mm a')}
        </span>
      </div>
      
      {displayName && (
        <div className="flex items-center text-xs text-gray-500 gap-1">
          <User className="h-3 w-3 flex-shrink-0" />
          <span className="truncate max-w-[100px]">{displayName}</span>
        </div>
      )}
    </div>
  );
};

export default TaskCardMetadata;
