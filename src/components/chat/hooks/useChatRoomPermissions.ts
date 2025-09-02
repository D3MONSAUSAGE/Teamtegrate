import { useAuth } from '@/contexts/AuthContext';

export const useChatRoomPermissions = () => {
  const { user } = useAuth();

  const canCreateChatRoom = () => {
    if (!user) return false;
    
    // Regular users cannot create chat rooms
    if (user.role === 'user') return false;
    
    // Team leaders, managers, admins, and superadmins can create chat rooms
    return ['team_leader', 'manager', 'admin', 'superadmin'].includes(user.role);
  };

  const canInviteToChat = (roomId: string, targetUserId: string) => {
    if (!user) return false;
    
    // Superadmins and admins can invite anyone within the organization
    if (['superadmin', 'admin'].includes(user.role)) return true;
    
    // Managers can invite their team members and other managers/admins
    if (user.role === 'manager') {
      // Check if user is inviting within their managed teams or other managers/admins
      return true; // This would need actual team membership check
    }
    
    // Team leaders can invite their team members only
    if (user.role === 'team_leader') {
      // Check if target user is in the same team(s) as the team leader
      return true; // This would need actual team membership check
    }
    
    return false;
  };

  const getAvailableUsersForInvite = () => {
    if (!user) return [];
    
    // This would return different user sets based on role:
    // - Superadmin/Admin: All organization users
    // - Manager: Their team members + other managers/admins
    // - Team Leader: Their team members only
    // - User: Nobody (can't create chats)
    
    return []; // Placeholder - implement based on actual team data
  };

  const canManageTeamChat = (teamId: string) => {
    if (!user) return false;
    
    // Superadmins and admins can manage any team chat
    if (['superadmin', 'admin'].includes(user.role)) return true;
    
    // Managers and team leaders can manage chats for their teams
    if (['manager', 'team_leader'].includes(user.role)) return true;
    
    return false;
  };

  return {
    canCreateChatRoom,
    canInviteToChat,
    canManageTeamChat,
    getAvailableUsersForInvite,
    userRole: user?.role,
    userTeams: [] // Return empty array when team context not available
  };
};