
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import { UserRole } from '@/types';

export function useChatPermissions() {
  const { user } = useAuth();

  const canCreateRooms = () => {
    if (!user?.role) {
      console.log('useChatPermissions: No user role found for canCreateRooms');
      return false;
    }
    
    console.log('useChatPermissions: Checking canCreateRooms for role:', user.role, 'type:', typeof user.role);
    
    // Ensure the role is properly typed
    const userRole = user.role as UserRole;
    const result = hasRoleAccess(userRole, 'manager');
    
    console.log('useChatPermissions: canCreateRooms result:', result, 'for role:', userRole);
    return result;
  };

  const canDeleteRoom = (roomCreatedBy: string) => {
    if (!user) {
      console.log('useChatPermissions: No user found for canDeleteRoom');
      return false;
    }
    
    console.log('useChatPermissions: Checking canDeleteRoom for user:', user.id, 'role:', user.role, 'roomCreatedBy:', roomCreatedBy);
    
    // Admins can delete any room (matches new RLS policy)
    if (hasRoleAccess(user.role as UserRole, 'admin')) {
      console.log('useChatPermissions: User is admin+, can delete any room');
      return true;
    }
    
    // Room creator can delete their own room (matches new RLS policy)
    if (user.id === roomCreatedBy) {
      console.log('useChatPermissions: User is room creator, can delete own room');
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
    
    // Admins can add participants to any room (matches new RLS policy)
    if (hasRoleAccess(user.role as UserRole, 'admin')) {
      console.log('useChatPermissions: User is admin+, can add participants to any room');
      return true;
    }
    
    // Room creator can add participants (matches new RLS policy)
    if (user.id === roomCreatedBy) {
      console.log('useChatPermissions: User is room creator, can add participants');
      return true;
    }
    
    console.log('useChatPermissions: User cannot add participants');
    return false;
  };

  const canAccessRoom = (roomCreatedBy: string) => {
    if (!user) {
      console.log('useChatPermissions: No user found for canAccessRoom');
      return false;
    }

    // Admins can access any room (matches new RLS policy)
    if (hasRoleAccess(user.role as UserRole, 'admin')) {
      console.log('useChatPermissions: User is admin+, can access any room');
      return true;
    }

    // Room creators can access their rooms (matches new RLS policy)
    if (user.id === roomCreatedBy) {
      console.log('useChatPermissions: User is room creator, can access room');
      return true;
    }

    // For participants, this will be handled by the participant check
    return false;
  };

  return {
    canCreateRooms,
    canDeleteRoom,
    canAddParticipants,
    canAccessRoom,
    userRole: user?.role
  };
}
