
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

        // Ensure we have an active session
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('useChatParticipantCheck: Session exists:', !!sessionData.session);
        
        if (!sessionData.session) {
          console.error('useChatParticipantCheck: No active session');
          setError('Authentication required');
          setIsParticipant(false);
          setIsLoading(false);
          return;
        }

        // Superadmins and admins have automatic access to all rooms
        if (hasRoleAccess(user.role as any, 'admin')) {
          console.log('useChatParticipantCheck: User is admin+, granting access');
          setIsParticipant(true);
          setIsLoading(false);
          return;
        }

        // For other users, check if they are a participant in the room
        // The new security definer functions will handle the access control
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
