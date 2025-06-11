import React from 'react';
import { User } from '@/types';
import AssignedMemberCard from './assignment/AssignedMemberCard';
import UserSearchDropdown from './assignment/UserSearchDropdown';
import { ScrollArea } from "@/components/ui/scroll-area"

interface TaskAssignmentSectionProps {
  assignedUsers: string[];
  onAssign: (userId: string) => void;
  onUnassign: (userId: string) => void;
  users: User[];
  isLoading?: boolean;
}

const TaskAssignmentSection: React.FC<TaskAssignmentSectionProps> = ({
  assignedUsers,
  onAssign,
  onUnassign,
  users,
  isLoading = false
}) => {
  const availableUsers = users.filter(user => !assignedUsers.includes(user.id));

  return (
    <div className="space-y-4">
      {/* Assigned Members List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Assigned Members</h4>
        <ScrollArea className="h-40 w-full rounded-md border p-2">
          {assignedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {users
                .filter(user => assignedUsers.includes(user.id))
                .map(user => (
                  <AssignedMemberCard
                    key={user.id}
                    user={user}
                    onRemove={onUnassign}
                  />
                ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Add Member */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Add Member</h4>
        <UserSearchDropdown
          users={availableUsers}
          onSelect={onAssign}
          assignedUsers={assignedUsers}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default TaskAssignmentSection;
