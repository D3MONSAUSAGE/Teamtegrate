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

/**
 * Check if a user can create templates for all teams
 */
export const canCreateTemplateForAllTeams = (userRole: UserRole | undefined): boolean => {
  if (!userRole) return false;
  return hasRoleAccess(userRole, 'manager');
};

/**
 * Check if a user can create templates for a specific team
 */
export const canCreateTemplateForTeam = (
  userRole: UserRole | undefined, 
  userId: string | undefined, 
  teamId: string
): boolean => {
  if (!userRole || !userId) return false;
  
  // Admins and superadmins can create templates for any team
  if (hasRoleAccess(userRole, 'admin')) {
    return true;
  }
  
  // Managers can create templates for teams they manage or for all teams
  if (hasRoleAccess(userRole, 'manager')) {
    return true; // For now, allow all managers - can be refined later with team manager checks
  }
  
  // Team leaders can create templates for their own team
  if (hasRoleAccess(userRole, 'team_leader')) {
    // This would need to be enhanced with actual team membership checks
    return true;
  }
  
  return false;
};