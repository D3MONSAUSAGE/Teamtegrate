
import { UserRole } from '@/types';
import { User as AppUser } from '@/types';
import { ROLE_HIERARCHY, hasRoleAccess as checkRoleAccess, canManageRole } from '../constants';

export const useRoleAccess = (user: AppUser | null) => {
  const hasRoleAccess = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return checkRoleAccess(user.role, requiredRole);
  };

  const canManageUser = (targetRole: UserRole): boolean => {
    if (!user) return false;
    return canManageRole(user.role, targetRole, targetRole);
  };

  return {
    hasRoleAccess,
    canManageUser
  };
};
