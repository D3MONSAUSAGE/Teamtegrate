
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, User as UserIcon } from 'lucide-react';
import { Task } from '@/types';

interface CollaborativeTaskIndicatorProps {
  task: Task;
  showAssigneeNames?: boolean;
  compact?: boolean;
}

const CollaborativeTaskIndicator: React.FC<CollaborativeTaskIndicatorProps> = ({
  task,
  showAssigneeNames = true,
  compact = false
}) => {
  const isCollaborative = task.assignedToIds && task.assignedToIds.length > 1;
  const assigneeCount = task.assignedToIds?.length || (task.assignedToId ? 1 : 0);
  const assigneeNames = task.assignedToNames || [];

  if (assigneeCount === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Unassigned
      </Badge>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {isCollaborative ? (
          <Users className="h-3 w-3 text-blue-600" />
        ) : (
          <UserIcon className="h-3 w-3 text-gray-600" />
        )}
        <span className="text-xs font-medium">
          {assigneeCount} {assigneeCount === 1 ? 'assignee' : 'assignees'}
        </span>
      </div>
    );
  }

  if (isCollaborative) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          <Users className="h-3 w-3 mr-1" />
          Collaborative
        </Badge>
        {showAssigneeNames && (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {assigneeNames.slice(0, 3).map((name, index) => (
                <Avatar key={index} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {assigneeNames.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{assigneeNames.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline">
        <UserIcon className="h-3 w-3 mr-1" />
        Individual
      </Badge>
      {showAssigneeNames && assigneeNames[0] && (
        <span className="text-sm text-muted-foreground">
          {assigneeNames[0]}
        </span>
      )}
    </div>
  );
};

export default CollaborativeTaskIndicator;
