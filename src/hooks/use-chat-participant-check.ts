
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';

interface ParticipantCheckResult {
  isParticipant: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useChatParticipantCheck(roomId: string): ParticipantCheckResult {
  const [isParticipant, setIsParticipant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const checkParticipation = async () => {
      if (!user || !roomId || !isAuthenticated) {
        setIsLoading(false);
        setIsParticipant(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Admins have automatic access to all rooms
        if (hasRoleAccess(user.role as any, 'admin')) {
          console.log('useChatParticipantCheck: User is admin+, granting access');
          setIsParticipant(true);
          setIsLoading(false);
          return;
        }

        // With the new RLS policies, we can simply try to fetch the room
        // If the user has access (creator or participant), they'll see it
        // If not, the query will return no results due to RLS
        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms')
          .select('id, created_by')
          .eq('id', roomId)
          .maybeSingle();

        if (roomError) {
          console.error('Error checking room access:', roomError);
          setError('Failed to verify room access');
          setIsParticipant(false);
        } else if (roomData) {
          // If we can see the room, we have access (RLS filtered it for us)
          console.log('useChatParticipantCheck: User has access to room');
          setIsParticipant(true);
        } else {
          // Room not found or no access
          console.log('useChatParticipantCheck: User does not have access to room');
          setIsParticipant(false);
        }
      } catch (err: any) {
        console.error('Error checking participant status:', err);
        setError(err.message || 'Failed to verify room access');
        setIsParticipant(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkParticipation();
  }, [user, roomId, isAuthenticated]);

  return { isParticipant, isLoading, error };
}
