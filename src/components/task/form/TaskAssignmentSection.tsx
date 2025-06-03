
import React from 'react';
import { Label } from "@/components/ui/label";
import TaskAssigneeSelect from './TaskAssigneeSelect';
import { AppUser } from '@/types';

interface TaskAssignmentSectionProps {
  selectedMember: string;
  onAssign: (userId: string) => void;
  users: AppUser[];
  isLoading: boolean;
}

const TaskAssignmentSection: React.FC<TaskAssignmentSectionProps> = ({
  selectedMember,
  onAssign,
  users,
  isLoading
}) => {
  return (
    <div>
      <Label htmlFor="assignee">Assign To</Label>
      <TaskAssigneeSelect
        selectedMember={selectedMember}
        onAssign={onAssign}
        users={users}
        isLoading={isLoading}
      />
    </div>
  );
};

export default TaskAssignmentSection;
