import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsersByContext } from './useUsersByContext';
import { useRealTeamMembers } from './team/useRealTeamMembers';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import { User } from '@/types';

export interface RoleBasedUsersResult {
  users: User[];
  isLoading: boolean;
  error: string | null;
  canViewTeamMembers: boolean;
  refetch: () => void;
}

/**
 * Hook to fetch users based on role-based permissions
 * - Superadmins/Admins: Can view all organization users
 * - Managers: Can view team members they manage
 * - Users: Can only view themselves
 */
export const useRoleBasedUsers = (teamId?: string): RoleBasedUsersResult => {
  const { user: currentUser } = useAuth();
  
  // Check if user can view team members
  const canViewTeamMembers = hasRoleAccess(currentUser?.role, 'manager');
  
  // For managers and above, fetch organization users or team members
  const { users: orgUsers, isLoading: orgLoading, error: orgError, refetch: refetchOrg } = useUsersByContext(
    currentUser?.organizationId,
    teamId
  );
  
  // For managers, also get team context
  const { teamMembers, isLoading: teamLoading, error: teamError, refetch: refetchTeam } = useRealTeamMembers(teamId);

  const filteredUsers = useMemo(() => {
    if (!currentUser) return [];
    
    // Users can only see themselves
    if (!canViewTeamMembers) {
      return [{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        organizationId: currentUser.organizationId,
        createdAt: currentUser.createdAt,
        timezone: currentUser.timezone || 'UTC',
        avatar_url: currentUser.avatar_url
      }];
    }
    
    // Managers and above can see organization users
    if (hasRoleAccess(currentUser.role, 'admin')) {
      // Admins and superadmins see all org users
      return orgUsers;
    }
    
    // Managers see team members they can access
    if (hasRoleAccess(currentUser.role, 'manager')) {
      // Combine org users with team member data for enhanced context
      const teamMemberIds = new Set(teamMembers.map(tm => tm.id));
      
      // Return org users that are also team members, plus current user
      const accessibleUsers = orgUsers.filter(user => 
        user.id === currentUser.id || teamMemberIds.has(user.id)
      );
      
      // Ensure current user is always included
      if (!accessibleUsers.find(u => u.id === currentUser.id)) {
        accessibleUsers.unshift({
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          organizationId: currentUser.organizationId,
          createdAt: currentUser.createdAt,
          timezone: currentUser.timezone || 'UTC',
          avatar_url: currentUser.avatar_url
        });
      }
      
      return accessibleUsers;
    }
    
    // Fallback - only current user
    return [{
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      organizationId: currentUser.organizationId,
      createdAt: currentUser.createdAt,
      timezone: currentUser.timezone || 'UTC',
      avatar_url: currentUser.avatar_url
    }];
  }, [currentUser, orgUsers, teamMembers, canViewTeamMembers]);

  const isLoading = orgLoading || teamLoading;
  const error = orgError || (teamError ? String(teamError) : null) || null;

  const refetch = () => {
    refetchOrg();
    refetchTeam();
  };

  return {
    users: filteredUsers,
    isLoading,
    error,
    canViewTeamMembers,
    refetch
  };
};