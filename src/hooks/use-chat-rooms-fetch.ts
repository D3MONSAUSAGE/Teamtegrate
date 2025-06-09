
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
      
      // First, verify that the session is working by testing auth
      const { data: authTest, error: authError } = await supabase.auth.getSession();
      if (authError || !authTest.session) {
        console.error('Session validation failed:', authError);
        throw new Error('Authentication session expired. Please refresh the page.');
      }
      
      // Test if we can access the users table first
      const { data: userTest, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('User table access failed:', userError);
        throw new Error('Database access error. Please refresh the page.');
      }
      
      console.log('User verification successful:', userTest);
      
      // Now try to fetch chat rooms with more specific error handling
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase chat rooms error:', error);
        
        // Handle specific error types
        if (error.message?.includes('infinite recursion')) {
          throw new Error('Database configuration error. Please contact support.');
        } else if (error.message?.includes('JWT') || error.message?.includes('session')) {
          throw new Error('Session expired. Please refresh the page.');
        } else if (error.code === 'PGRST301') {
          throw new Error('Access denied. Please check your permissions.');
        } else {
          throw error;
        }
      }

      debug.logQueryResult(data, null);
      console.log('ChatRooms: Successfully fetched rooms:', data?.length || 0);

      setRooms(data || []);
      
      if (!data || data.length === 0) {
        console.log('No rooms found - this is normal for new users');
        setError(null); // Don't show error for empty rooms list
      }
      
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      debug.logUnexpectedError(error);
      
      setError(`Failed to load chat rooms: ${error.message}`);
      toast.error('Failed to load chat rooms: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role, debug, setRooms, setIsLoading, setError]);

  return {
    fetchRooms
  };
}
