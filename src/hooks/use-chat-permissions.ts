
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/types';

export function useChatPermissions() {
  const { user } = useAuth();

  const canCreateRooms = () => {
    if (!user?.role) return false;
    return hasRoleAccess(user.role as any, 'manager');
  };

  const canDeleteRoom = (roomCreatedBy: string) => {
    if (!user) return false;
    
    // Room creator can delete their own room (if they're manager or above)
    if (user.id === roomCreatedBy && hasRoleAccess(user.role as any, 'manager')) {
      return true;
    }
    
    // Admins and superadmins can delete any room
    return hasRoleAccess(user.role as any, 'admin');
  };

  const canAddParticipants = (roomCreatedBy: string) => {
    if (!user) return false;
    
    // Room creator can add participants
    if (user.id === roomCreatedBy) {
      return true;
    }
    
    // Admins and superadmins can add participants to any room
    return hasRoleAccess(user.role as any, 'admin');
  };

  return {
    canCreateRooms,
    canDeleteRoom,
    canAddParticipants,
    userRole: user?.role
  };
}
