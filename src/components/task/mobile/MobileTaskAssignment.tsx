
import React from 'react';
import { User, Task } from '@/types';
import EnhancedTaskAssignment from '../form/assignment/EnhancedTaskAssignment';

interface MobileTaskAssignmentProps {
  selectedMember: string | undefined;
  selectedMembers: string[];
  users: User[];
  loadingUsers: boolean;
  onAssign: (userId: string) => void;
  onMembersChange: (memberIds: string[]) => void;
  editingTask?: Task;
}

const MobileTaskAssignment: React.FC<MobileTaskAssignmentProps> = ({
  selectedMember,
  selectedMembers,
  users,
  loadingUsers,
  onAssign,
  onMembersChange,
  editingTask
}) => {
  return (
    <div className="space-y-3">
      <EnhancedTaskAssignment
        selectedMember={selectedMember}
        selectedMembers={selectedMembers}
        onAssign={onAssign}
        onMembersChange={onMembersChange}
        users={users}
        isLoading={loadingUsers}
        editingTask={editingTask}
      />
    </div>
  );
};

export default MobileTaskAssignment;
