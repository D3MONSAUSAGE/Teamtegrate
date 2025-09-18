
import { UserRole } from '@/types';
import { ROLE_HIERARCHY, hasRoleAccess as checkRoleAccess, canManageRole } from './constants';

export { ROLE_HIERARCHY };

export const hasRoleAccess = checkRoleAccess;

export const canManageUser = (userRole: UserRole | undefined, targetRole: UserRole): boolean => {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole as UserRole];
};
