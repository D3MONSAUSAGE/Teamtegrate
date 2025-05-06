
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
  // Only consider a task unassigned if there's no assignedToId
  const isUnassigned = !assignedToId;
  
  // Format the display name - if empty or undefined, show "Unassigned"
  const displayName = !isUnassigned && assignedToName 
    ? assignedToName.trim() 
    : 'Unassigned';

  // Debug logging for assignment troubleshooting
  console.log('TaskCardMetadata render:', {
    assignedToId: assignedToId || 'none',
    assignedToName: assignedToName || 'none',
    isUnassigned,
    displayName
  });

  return (
    <div className="flex items-center justify-between pt-1 md:pt-2">
      <div className="flex items-center text-xs text-gray-500 gap-1">
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">
          {format(new Date(deadline), 'MMM d')} at {format(new Date(deadline), 'h:mm a')}
        </span>
      </div>
      
      <div className="flex items-center text-xs text-gray-500 gap-1">
        <User className="h-3 w-3 flex-shrink-0" />
        <span 
          className={`truncate max-w-[100px] ${isUnassigned ? 'italic text-gray-400' : ''}`}
          title={displayName}
        >
          {displayName}
        </span>
      </div>
    </div>
  );
};

export default TaskCardMetadata;
