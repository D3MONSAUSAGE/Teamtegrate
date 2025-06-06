
import React from 'react';
import { Label } from "@/components/ui/label";
import TaskAssigneeSelect from './TaskAssigneeSelect';
import TaskMultiAssigneeSelect from './TaskMultiAssigneeSelect';
import { AppUser } from '@/types';

interface TaskAssignmentSectionProps {
  selectedMember: string;
  selectedMembers?: string[];
  onAssign: (userId: string) => void;
  onMembersChange?: (memberIds: string[]) => void;
  users: AppUser[];
  isLoading: boolean;
  multiSelect?: boolean;
}

const TaskAssignmentSection: React.FC<TaskAssignmentSectionProps> = ({
  selectedMember,
  selectedMembers = [],
  onAssign,
  onMembersChange,
  users,
  isLoading,
  multiSelect = false
}) => {
  console.log('TaskAssignmentSection - multiSelect:', multiSelect, 'isLoading:', isLoading, 'users:', users);
  
  return (
    <div>
      <Label htmlFor="assignee">Assign To</Label>
      {multiSelect && onMembersChange ? (
        <TaskMultiAssigneeSelect
          selectedMembers={selectedMembers}
          onMembersChange={onMembersChange}
          users={users}
          isLoading={isLoading}
        />
      ) : (
        <TaskAssigneeSelect
          selectedMember={selectedMember}
          onAssign={onAssign}
          users={users}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default TaskAssignmentSection;
