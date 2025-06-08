
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ParticipantCheckResult {
  isParticipant: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useChatParticipantCheck(roomId: string): ParticipantCheckResult {
  const [isParticipant, setIsParticipant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkParticipation = async () => {
      if (!user || !roomId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if user is a participant in the room
        const { data, error: checkError } = await supabase
          .from('chat_room_participants')
          .select('id')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 means no rows found, which is expected if not a participant
          throw checkError;
        }

        setIsParticipant(!!data);
      } catch (err: any) {
        console.error('Error checking participant status:', err);
        setError(err.message || 'Failed to verify room access');
        setIsParticipant(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkParticipation();
  }, [user, roomId]);

  return { isParticipant, isLoading, error };
}
