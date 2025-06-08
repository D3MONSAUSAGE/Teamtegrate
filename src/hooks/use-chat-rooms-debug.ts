
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";

interface ChatRoomData {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  last_message_at?: string;
  unread_count?: number;
}

export function useChatRoomsDebug() {
  const { user } = useAuth();

  const logDebugInfo = async () => {
    console.log('=== CHAT ROOMS DEBUG START ===');
    console.log('Current user:', user);
    console.log('User ID:', user?.id);
    console.log('User role:', user?.role);
    
    // Test the get_user_role function first
    const { data: roleData, error: roleError } = await supabase.rpc('get_user_role');
    console.log('get_user_role() result:', roleData);
    if (roleError) {
      console.error('Error calling get_user_role():', roleError);
    }

    console.log('Fetching chat rooms...');
  };

  const logQueryResult = (data: ChatRoomData[] | null, error: any) => {
    console.log('Supabase query result:');
    console.log('- Data:', data);
    console.log('- Error:', error);
    console.log('- Number of rooms returned:', data?.length || 0);

    if (error) {
      console.error('Error details:', JSON.stringify(error, null, 2));
    }

    if (!data || data.length === 0) {
      console.warn('No chat rooms returned from database');
      console.log('This could mean:');
      console.log('1. No rooms exist in the database');
      console.log('2. RLS policies are blocking access');
      console.log('3. User is not authenticated properly');
      console.log('Testing raw query without RLS...');
    }
  };

  const logProcessedRooms = (roomsWithMeta: ChatRoomData[]) => {
    console.log('Final rooms with metadata:', roomsWithMeta);
    console.log('=== CHAT ROOMS DEBUG END ===');
  };

  const logRoomSelection = (room: ChatRoomData) => {
    console.log('Room selected:', room);
  };

  const logRenderState = (rooms: ChatRoomData[], filteredRooms: ChatRoomData[], searchQuery: string, canCreateRooms: boolean) => {
    console.log('Render state:');
    console.log('- Total rooms:', rooms.length);
    console.log('- Filtered rooms:', filteredRooms.length);
    console.log('- Search query:', searchQuery);
    console.log('- Can create rooms:', canCreateRooms);
  };

  const logRealtimeUpdate = (payload: any) => {
    console.log('Real-time chat room update:', payload);
  };

  const logUnexpectedError = (error: any) => {
    console.error('Unexpected error fetching rooms:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  };

  return {
    logDebugInfo,
    logQueryResult,
    logProcessedRooms,
    logRoomSelection,
    logRenderState,
    logRealtimeUpdate,
    logUnexpectedError
  };
}
