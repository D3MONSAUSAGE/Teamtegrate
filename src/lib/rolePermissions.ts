import { UserRole } from '@/types';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';

/**
 * Check if a user can delete an inventory template based on their role and ownership
 */
export const canDeleteTemplate = (
  userRole: UserRole | undefined, 
  userId: string | undefined, 
  templateCreatedBy: string
): boolean => {
  if (!userRole || !userId) return false;
  
  // Admins and superadmins can delete any template
  if (hasRoleAccess(userRole, 'admin')) {
    return true;
  }
  
  // Managers can only delete templates they created
  if (hasRoleAccess(userRole, 'manager')) {
    return templateCreatedBy === userId;
  }
  
  // Team leaders and regular users cannot delete templates
  return false;
};