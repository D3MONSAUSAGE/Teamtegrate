
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from './userManagement/useUserData';
import { useUserOperations } from './userManagement/useUserOperations';
import { useRoleManagement } from './userManagement/useRoleManagement';

export const useEnhancedUserManagement = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { users, isLoading: usersLoading, error } = useUserData();

  const refetchUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['enhanced-organization-users'] });
    queryClient.invalidateQueries({ queryKey: ['organization-stats'] });
  };

  const { 
    isLoading: operationsLoading,
    createUser,
    updateUserProfile
  } = useUserOperations(refetchUsers);

  const {
    isLoading: roleLoading,
    changeUserRole,
    validateRoleChange,
    bulkChangeRoles,
    transferSuperadminRole
  } = useRoleManagement(users, refetchUsers);

  const isSuperadmin = currentUser?.role === 'superadmin';

  return {
    users,
    isLoading: usersLoading || operationsLoading || roleLoading,
    error,
    isSuperadmin,
    
    // CRUD operations
    createUser: (email: string, name: string, role: any, temporaryPassword: string) => 
      createUser(email, name, role, temporaryPassword, users),
    updateUserProfile: (userId: string, updates: { name?: string; email?: string }) =>
      updateUserProfile(userId, updates, users),
    
    // Role management
    changeUserRole,
    validateRoleChange,
    bulkChangeRoles,
    transferSuperadminRole,
    
    // Utilities
    refetchUsers
  };
};
