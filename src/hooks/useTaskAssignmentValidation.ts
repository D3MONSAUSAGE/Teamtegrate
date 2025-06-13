
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { toast } from '@/components/ui/sonner';

export const useTaskAssignmentValidation = () => {
  const { user } = useAuth();

  const validateUserAssignment = (selectedUserId: string, users: User[]): boolean => {
    if (!selectedUserId || selectedUserId === "unassigned") {
      return true; // Unassigned is always valid
    }

    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) {
      toast.error('Selected user not found');
      return false;
    }

    // Check if user belongs to the same organization
    if (user?.organizationId && selectedUser.organizationId !== user.organizationId) {
      toast.error('Cannot assign tasks to users from different organizations');
      return false;
    }

    return true;
  };

  const validateMultipleAssignments = (selectedUserIds: string[], users: User[]): boolean => {
    if (!selectedUserIds || selectedUserIds.length === 0) {
      return true; // Empty assignment is valid
    }

    for (const userId of selectedUserIds) {
      if (!validateUserAssignment(userId, users)) {
        return false;
      }
    }

    return true;
  };

  const getAssignmentPermissions = () => {
    if (!user) return { canAssign: false, canAssignToAnyone: false };

    const isSuperAdmin = user.role === 'superadmin';
    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager';

    return {
      canAssign: true,
      canAssignToAnyone: isSuperAdmin,
      canAssignWithinOrg: isSuperAdmin || isAdmin,
      canAssignTeamMembers: isSuperAdmin || isAdmin || isManager,
      canOnlyAssignSelf: !isSuperAdmin && !isAdmin && !isManager
    };
  };

  const filterAssignableUsers = (users: User[]): User[] => {
    const permissions = getAssignmentPermissions();
    
    if (!permissions.canAssign) return [];
    
    if (permissions.canAssignToAnyone) {
      return users;
    }
    
    if (permissions.canAssignWithinOrg) {
      return users.filter(u => u.organizationId === user?.organizationId);
    }
    
    if (permissions.canOnlyAssignSelf) {
      return users.filter(u => u.id === user?.id);
    }
    
    return users.filter(u => u.organizationId === user?.organizationId);
  };

  const formatAssignmentData = (userId: string, users: User[]) => {
    if (!userId || userId === "unassigned") {
      return { assignedToId: undefined, assignedToName: undefined };
    }

    const selectedUser = users.find(u => u.id === userId);
    return {
      assignedToId: userId,
      assignedToName: selectedUser?.name || selectedUser?.email || 'Unknown User'
    };
  };

  const formatMultiAssignmentData = (userIds: string[], users: User[]) => {
    if (!userIds || userIds.length === 0) {
      return { assignedToIds: undefined, assignedToNames: undefined };
    }

    const validUsers = userIds
      .map(id => users.find(u => u.id === id))
      .filter(Boolean) as User[];

    return {
      assignedToIds: validUsers.map(u => u.id),
      assignedToNames: validUsers.map(u => u.name || u.email)
    };
  };

  return {
    validateUserAssignment,
    validateMultipleAssignments,
    getAssignmentPermissions,
    filterAssignableUsers,
    formatAssignmentData,
    formatMultiAssignmentData
  };
};
