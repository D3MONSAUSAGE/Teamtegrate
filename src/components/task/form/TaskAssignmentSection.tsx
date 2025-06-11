
import React from 'react';
import { User } from '@/types';
import { Label } from "@/components/ui/label";
import TaskAssigneeSelect from './TaskAssigneeSelect';

interface TaskAssignmentSectionProps {
  selectedUser?: string;
  onAssign: (userId: string) => void;
  users: User[];
  isLoading: boolean;
}

const TaskAssignmentSection: React.FC<TaskAssignmentSectionProps> = ({
  selectedUser = "unassigned",
  onAssign,
  users,
  isLoading
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Assignee</Label>
        <TaskAssigneeSelect 
          users={users}
          selectedUser={selectedUser}
          onUserSelect={onAssign}
          placeholder={isLoading ? "Loading users..." : "Select assignee"}
        />
      </div>
    </div>
  );
};

export default TaskAssignmentSection;
