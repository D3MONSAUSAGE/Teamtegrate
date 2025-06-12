
import { UserRole } from '@/types';
import { User as AppUser } from '@/types';

export const useRoleAccess = (user: AppUser | null) => {
  const hasRoleAccess = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      'user': 1,
      'manager': 2,
      'admin': 3,
      'superadmin': 4
    };
    
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requiredRole];
    
    return userLevel >= requiredLevel;
  };

  const canManageUser = (targetRole: UserRole): boolean => {
    if (!user) return false;
    
    if (user.role === 'superadmin') return true;
    if (user.role === 'admin' && ['manager', 'user'].includes(targetRole)) return true;
    if (user.role === 'manager' && targetRole === 'user') return true;
    
    return false;
  };

  return {
    hasRoleAccess,
    canManageUser
  };
};
