
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
  const { user, logout } = useAuth();
  const debug = useChatRoomsDebug();

  const fetchRooms = useCallback(async () => {
    if (!user) {
      console.log('ChatRooms: No user found, skipping fetch');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('ChatRooms: Fetching rooms for user:', user.id, 'role:', user.role);
      
      // Test session validity first
      const { data: sessionTest, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionTest.session) {
        console.error('Session invalid during room fetch:', sessionError);
        toast.error('Session expired. Please log in again.');
        await logout();
        return;
      }

      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase chat rooms error:', error);
        
        // Check if it's an auth-related error
        if (error.message.includes('JWT') || error.message.includes('auth') || error.code === 'PGRST301') {
          console.log('Authentication error detected, forcing logout');
          toast.error('Session expired. Please log in again.');
          await logout();
          return;
        }
        
        throw error;
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
      
      // Handle specific auth errors
      if (error.message?.includes('infinite recursion') || 
          error.message?.includes('JWT') || 
          error.message?.includes('auth')) {
        console.log('Authentication/RLS error, forcing logout');
        toast.error('Authentication error. Please log in again.');
        await logout();
        return;
      }
      
      setError(`Failed to load chat rooms: ${error.message}`);
      toast.error('Failed to load chat rooms: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role, debug, setRooms, setIsLoading, setError, logout]);

  return {
    fetchRooms
  };
}
