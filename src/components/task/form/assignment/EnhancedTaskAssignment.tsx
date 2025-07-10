
import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import AssignmentErrorBoundary from './AssignmentErrorBoundary';
import UnifiedTaskAssignment from './UnifiedTaskAssignment';

interface EnhancedTaskAssignmentProps {
  selectedMember?: string;
  selectedMembers: string[];
  onAssign: (userId: string) => void;
  onMembersChange: (memberIds: string[]) => void;
  users: User[];
  isLoading: boolean;
  editingTask?: any;
}

const EnhancedTaskAssignment: React.FC<EnhancedTaskAssignmentProps> = ({
  selectedMember,
  selectedMembers,
  onAssign,
  onMembersChange,
  users: fallbackUsers,
  isLoading: fallbackLoading,
  editingTask
}) => {
  const { user: currentUser } = useAuth();

  // Determine initial mode based on existing assignment
  const [multiAssignMode, setMultiAssignMode] = useState(
    editingTask?.assignedToIds?.length > 1 || selectedMembers.length > 1
  );

  const handleSelectionChange = (newUsers: User[]) => {
    if (multiAssignMode) {
      onMembersChange(newUsers.map(u => u.id));
    } else if (newUsers.length > 0) {
      onAssign(newUsers[0].id);
    } else {
      onAssign("unassigned");
    }
  };

  return (
    <AssignmentErrorBoundary>
      <UnifiedTaskAssignment
        selectedMember={selectedMember}
        selectedMembers={selectedMembers}
        onAssign={onAssign}
        onMembersChange={onMembersChange}
        onSelectionChange={handleSelectionChange}
        users={fallbackUsers}
        isLoading={fallbackLoading}
        multiAssignMode={multiAssignMode}
        editingTask={editingTask}
        showOrganizationSelect={currentUser?.role === 'superadmin'}
        showTeamSelect={currentUser?.role === 'superadmin' || currentUser?.role === 'admin'}
      />
    </AssignmentErrorBoundary>
  );
};

export default EnhancedTaskAssignment;
