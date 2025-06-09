
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
  const { user, isAuthenticated } = useAuth();
  const debug = useChatRoomsDebug();

  const fetchRooms = useCallback(async () => {
    if (!user || !isAuthenticated) {
      console.log('ChatRooms: No authenticated user, skipping fetch');
      setIsLoading(false);
      setRooms([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('ChatRooms: Fetching rooms for user:', user.id, 'role:', user.role);
      
      // Now fetch chat rooms with improved error handling
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase chat rooms error:', error);
        
        // Only throw error if it's not a simple permissions issue
        if (error.code !== 'PGRST116' && !error.message.includes('permission denied')) {
          throw error;
        }
        
        // For permission errors, just return empty results
        setRooms([]);
        setError(null);
        return;
      }

      debug.logQueryResult(data, null);
      console.log('ChatRooms: Successfully fetched rooms:', data?.length || 0);

      setRooms(data || []);
      
      if (!data || data.length === 0) {
        console.log('No rooms found - this is normal for new users');
        setError(null);
      }
      
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      debug.logUnexpectedError(error);
      
      setError(`Failed to load chat rooms: ${error.message}`);
      toast.error('Failed to load chat rooms: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role, isAuthenticated, debug, setRooms, setIsLoading, setError]);

  return {
    fetchRooms
  };
}
