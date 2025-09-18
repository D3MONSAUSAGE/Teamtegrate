
import { UserRole } from '@/types';
import { User as AppUser } from '@/types';

export const useRoleAccess = (user: AppUser | null) => {
  const hasRoleAccess = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    
    // Use centralized role hierarchy
    const roleHierarchy: Record<UserRole, number> = {
      'user': 1,
      'team_leader': 2,
      'manager': 3,
      'admin': 4,
      'superadmin': 5
    };
    
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requiredRole];
    
    return userLevel >= requiredLevel;
  };

  const canManageUser = (targetRole: UserRole): boolean => {
    if (!user) return false;
    
    if (user.role === 'superadmin') return true;
    if (user.role === 'admin' && ['manager', 'team_leader', 'user'].includes(targetRole)) return true;
    if (user.role === 'manager' && ['team_leader', 'user'].includes(targetRole)) return true;
    if (user.role === 'team_leader' && targetRole === 'user') return true;
    
    return false;
  };

  return {
    hasRoleAccess,
    canManageUser
  };
};
