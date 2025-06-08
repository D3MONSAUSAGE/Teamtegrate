
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useChatRoomsDebug } from '@/hooks/use-chat-rooms-debug';
import { toast } from 'sonner';

interface ChatRoomData {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  last_message_at?: string;
  unread_count?: number;
}

interface UseChatRoomsFetchProps {
  setRooms: (rooms: ChatRoomData[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export function useChatRoomsFetch({ setRooms, setIsLoading, setError }: UseChatRoomsFetchProps) {
  const { user } = useAuth();
  const debug = useChatRoomsDebug();

  const fetchRooms = useCallback(async () => {
    if (!user) {
      console.log('ChatRooms: No user found, skipping fetch');
      setIsLoading(false);
      return;
    }

    await debug.logDebugInfo();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('ChatRooms: Fetching rooms for user:', user.id, 'role:', user.role);
      
      // Simple query - RLS policies will handle access control
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      debug.logQueryResult(data, null);
      console.log('ChatRooms: Successfully fetched rooms:', data?.length || 0);

      if (!data || data.length === 0) {
        setRooms([]);
        setError('No chat rooms found. You may need to create one or be added to existing rooms.');
        return;
      }

      setRooms(data);
      
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      debug.logUnexpectedError(error);
      
      if (error.message?.includes('JWT') || error.message?.includes('session')) {
        setError('Session expired. Please refresh the page.');
        toast.error('Session expired. Please refresh the page.');
      } else {
        setError(`Failed to load chat rooms: ${error.message}`);
        toast.error('Failed to load chat rooms');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, debug, setRooms, setIsLoading, setError]);

  const subscribeToRooms = useCallback(() => {
    const channel = supabase
      .channel('chat-rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_rooms' },
        (payload) => {
          debug.logRealtimeUpdate(payload);
          fetchRooms();
        }
      )
      .subscribe();

    return channel;
  }, [debug, fetchRooms]);

  return {
    fetchRooms,
    subscribeToRooms
  };
}
