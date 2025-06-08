
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';

export function useChatPermissions() {
  const { user } = useAuth();

  const canCreateRooms = () => {
    if (!user?.role) {
      console.log('useChatPermissions: No user role found for canCreateRooms');
      return false;
    }
    console.log('useChatPermissions: Checking canCreateRooms for role:', user.role);
    const result = hasRoleAccess(user.role as any, 'manager');
    console.log('useChatPermissions: canCreateRooms result:', result);
    return result;
  };

  const canDeleteRoom = (roomCreatedBy: string) => {
    if (!user) {
      console.log('useChatPermissions: No user found for canDeleteRoom');
      return false;
    }
    
    console.log('useChatPermissions: Checking canDeleteRoom for user:', user.id, 'role:', user.role, 'roomCreatedBy:', roomCreatedBy);
    
    // Superadmins can delete any room
    if (hasRoleAccess(user.role as any, 'superadmin')) {
      console.log('useChatPermissions: User is superadmin, can delete any room');
      return true;
    }
    
    // Admins can delete any room
    if (hasRoleAccess(user.role as any, 'admin')) {
      console.log('useChatPermissions: User is admin, can delete any room');
      return true;
    }
    
    // Room creator can delete their own room (if they're manager or above)
    if (user.id === roomCreatedBy && hasRoleAccess(user.role as any, 'manager')) {
      console.log('useChatPermissions: User is room creator and manager+, can delete own room');
      return true;
    }
    
    console.log('useChatPermissions: User cannot delete room');
    return false;
  };

  const canAddParticipants = (roomCreatedBy: string) => {
    if (!user) {
      console.log('useChatPermissions: No user found for canAddParticipants');
      return false;
    }
    
    console.log('useChatPermissions: Checking canAddParticipants for user:', user.id, 'role:', user.role);
    
    // Superadmins and admins can add participants to any room
    if (hasRoleAccess(user.role as any, 'admin')) {
      console.log('useChatPermissions: User is admin+, can add participants to any room');
      return true;
    }
    
    // Room creator can add participants
    if (user.id === roomCreatedBy) {
      console.log('useChatPermissions: User is room creator, can add participants');
      return true;
    }
    
    console.log('useChatPermissions: User cannot add participants');
    return false;
  };

  return {
    canCreateRooms,
    canDeleteRoom,
    canAddParticipants,
    userRole: user?.role
  };
}
