
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
  return (
    <div className="flex items-center justify-between pt-1 md:pt-2">
      <div className="flex items-center text-xs text-gray-500 gap-1">
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">
          {format(deadline, 'MMM d')} at {format(deadline, 'h:mm a')}
        </span>
      </div>
      
      {assignedToName && (
        <div className="flex items-center text-xs text-gray-500 gap-1">
          <User className="h-3 w-3 flex-shrink-0" />
          <span className="truncate max-w-[100px]">{assignedToName}</span>
        </div>
      )}
    </div>
  );
};

export default TaskCardMetadata;
