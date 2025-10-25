
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from './userManagement/useUserData';
import { useUserOperations } from './userManagement/useUserOperations';
import { useRoleManagement } from './userManagement/useRoleManagement';
import { useTeamAccess } from './useTeamAccess';

export const useEnhancedUserManagement = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  // Get team access info to determine if filtering is needed
  const { availableTeams, isAdmin, isSuperAdmin } = useTeamAccess();
  
  // For managers (not admins), get only their team IDs
  const managedTeamIds = (!isAdmin && !isSuperAdmin) 
    ? availableTeams.map(team => team.id) 
    : undefined;

  const { users, isLoading: usersLoading, error } = useUserData(managedTeamIds);

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
    
    // CRUD operations - Fixed function signatures
    createUser: (email: string, name: string, role: any, temporaryPassword: string) => 
      createUser(email, name, role, temporaryPassword),
    updateUserProfile: (userId: string, updates: { name?: string; email?: string }) =>
      updateUserProfile(userId, updates),
    
    // Role management
    changeUserRole,
    validateRoleChange,
    bulkChangeRoles,
    transferSuperadminRole,
    
    // Utilities
    refetchUsers
  };
};
