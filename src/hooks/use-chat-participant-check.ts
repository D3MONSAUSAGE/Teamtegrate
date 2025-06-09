
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

        // Simple check - if we can see the room via RLS, we have access
        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('id', roomId)
          .single();

        if (roomError) {
          // If we can't see the room, we don't have access
          if (roomError.code === 'PGRST116') {
            setIsParticipant(false);
          } else {
            console.error('Error checking room access:', roomError);
            setError('Failed to verify room access');
            setIsParticipant(false);
          }
        } else {
          // If we can see the room, we have access (RLS filtered it for us)
          setIsParticipant(true);
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
