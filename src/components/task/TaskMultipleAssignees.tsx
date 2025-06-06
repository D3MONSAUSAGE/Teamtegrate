
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface TaskMultipleAssigneesProps {
  assignedToNames?: string[];
  assignedToIds?: string[];
  maxDisplay?: number;
  variant?: 'card' | 'detail';
}

const TaskMultipleAssignees: React.FC<TaskMultipleAssigneesProps> = ({
  assignedToNames = [],
  assignedToIds = [],
  maxDisplay = 3,
  variant = 'card'
}) => {
  if (assignedToNames.length === 0) {
    return <span className="text-gray-500 text-sm">Unassigned</span>;
  }

  if (variant === 'detail') {
    return (
      <div className="flex flex-wrap gap-1">
        {assignedToNames.map((name, index) => (
          <Badge key={assignedToIds[index] || index} variant="secondary" className="text-xs">
            {name}
          </Badge>
        ))}
      </div>
    );
  }

  // Card variant - compact display
  const displayNames = assignedToNames.slice(0, maxDisplay);
  const remainingCount = assignedToNames.length - maxDisplay;

  return (
    <div className="flex items-center gap-1">
      <Users className="h-3 w-3 text-gray-500" />
      <div className="flex items-center gap-1">
        {displayNames.map((name, index) => (
          <Avatar key={assignedToIds[index] || index} className="h-5 w-5">
            <AvatarFallback className="text-xs">
              {name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-gray-500">
            +{remainingCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskMultipleAssignees;
