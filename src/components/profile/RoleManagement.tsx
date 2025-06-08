
import React from 'react';
import { useRoleManagement } from './role-management/useRoleManagement';
import RoleSelector from './role-management/RoleSelector';
import RoleChangeDialog from './role-management/RoleChangeDialog';

interface RoleManagementProps {
  targetUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onRoleChanged: () => void;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ targetUser, onRoleChanged }) => {
  const {
    canManageThisUser,
    getAvailableRoles,
    isChangingRole,
    newRole,
    confirmDialogOpen,
    handleRoleSelect,
    handleRoleChange,
    handleDialogClose,
    currentTargetRole
  } = useRoleManagement({ targetUser, onRoleChanged });

  if (!canManageThisUser) {
    return null;
  }

  const availableRoles = getAvailableRoles();

  if (availableRoles.length === 0) {
    return null;
  }

  return (
    <>
      <RoleSelector
        availableRoles={availableRoles}
        isChanging={isChangingRole}
        onRoleSelect={handleRoleSelect}
      />

      <RoleChangeDialog
        isOpen={confirmDialogOpen}
        onClose={handleDialogClose}
        onConfirm={handleRoleChange}
        isChanging={isChangingRole}
        targetUserName={targetUser.name}
        currentRole={currentTargetRole}
        newRole={newRole}
      />
    </>
  );
};

export default RoleManagement;
