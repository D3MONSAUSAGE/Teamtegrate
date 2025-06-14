
import { useAuth } from '@/contexts/AuthContext';

export function useChatPermissions() {
  const { user } = useAuth();

  const canDeleteRoom = (roomCreatedBy: string) => {
    return user?.id === roomCreatedBy || user?.role === 'superadmin';
  };

  const canAddParticipants = (roomCreatedBy: string) => {
    return user?.id === roomCreatedBy || user?.role === 'superadmin';
  };

  const canModerate = (roomCreatedBy: string) => {
    return user?.id === roomCreatedBy || user?.role === 'superadmin';
  };

  return {
    canDeleteRoom,
    canAddParticipants,
    canModerate
  };
}
