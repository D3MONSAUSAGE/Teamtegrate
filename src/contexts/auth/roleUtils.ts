
import { UserRole } from '@/types';

// Centralized role hierarchy - single source of truth
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'user': 1,
  'team_leader': 2,
  'manager': 3,
  'admin': 4,
  'superadmin': 5
};

export const hasRoleAccess = (userRole: UserRole | undefined, requiredRole: UserRole): boolean => {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

export const canManageUser = (userRole: UserRole | undefined, targetRole: UserRole): boolean => {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole as UserRole];
};
