import { UserRole } from '@/types';

// Centralized role hierarchy - single source of truth
// This should match the database function get_role_hierarchy()
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'user': 1,
  'team_leader': 2,
  'manager': 3,
  'admin': 4,
  'superadmin': 5
};

// Helper functions for role management
export const getRoleLevel = (role: UserRole): number => {
  return ROLE_HIERARCHY[role] || 0;
};

export const canManageRole = (userRole: UserRole, targetRole: UserRole, newRole: UserRole): boolean => {
  const userLevel = getRoleLevel(userRole);
  const targetLevel = getRoleLevel(targetRole);
  const newRoleLevel = getRoleLevel(newRole);
  
  // User must have higher level than both target and new role
  if (userLevel <= targetLevel || userLevel <= newRoleLevel) {
    return false;
  }
  
  // Only superadmins can manage superadmin roles
  if ((targetRole === 'superadmin' || newRole === 'superadmin') && userRole !== 'superadmin') {
    return false;
  }
  
  return true;
};

export const hasRoleAccess = (userRole: UserRole | undefined, requiredRole: UserRole): boolean => {
  if (!userRole) return false;
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
};