
import React from 'react';
import { User } from '@/types';
import { Label } from "@/components/ui/label";
import TaskAssigneeSelect from './TaskAssigneeSelect';

interface TaskAssignmentSectionProps {
  selectedMember?: string;
  onAssign: (userId: string) => void;
  users: User[];
  isLoading: boolean;
}

const TaskAssignmentSection: React.FC<TaskAssignmentSectionProps> = ({
  selectedMember = "unassigned",
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
          selectedUser={selectedMember}
          onUserSelect={onAssign}
          placeholder={isLoading ? "Loading users..." : "Select assignee"}
        />
      </div>
    </div>
  );
};

export default TaskAssignmentSection;
