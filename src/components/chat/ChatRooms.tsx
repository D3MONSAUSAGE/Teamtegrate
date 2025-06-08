import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useChatPermissions } from '@/hooks/use-chat-permissions';
import { useChatRoomsDebug } from '@/hooks/use-chat-rooms-debug';
import CreateRoomDialog from './CreateRoomDialog';
import ChatRoomsHeader from './ChatRoomsHeader';
import ChatRoomsSearch from './ChatRoomsSearch';
import ChatRoomsList from './ChatRoomsList';
import ChatRoomsEmptyState from './ChatRoomsEmptyState';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ChatRoomData {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  last_message_at?: string;
  unread_count?: number;
}

interface ChatRoomsProps {
  selectedRoom: ChatRoomData | null;
  onRoomSelect: (room: ChatRoomData) => void;
}

const ChatRooms: React.FC<ChatRoomsProps> = ({ selectedRoom, onRoomSelect }) => {
  const [rooms, setRooms] = useState<ChatRoomData[]>([]);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { canCreateRooms } = useChatPermissions();
  const debug = useChatRoomsDebug();
  
  useEffect(() => {
    fetchRooms();
    const channel = subscribeToRooms();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRooms = async () => {
    await debug.logDebugInfo();
    
    try {
      console.log('ChatRooms: Fetching rooms for user:', user?.id, 'role:', user?.role);
      
      // The new RLS policy will automatically filter rooms based on role
      // Superadmins and admins will see all rooms
      // Others will only see rooms they created or participate in
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      debug.logQueryResult(data, error);

      if (error) {
        console.error('Error fetching rooms:', error);
        toast.error('Failed to load chat rooms');
        return;
      }

      console.log('ChatRooms: Fetched rooms:', data?.length || 0);

      if (!data || data.length === 0) {
        setRooms([]);
        return;
      }

      // Process rooms without adding unread_count
      const roomsWithMeta = data.map(room => {
        console.log('Processing room:', room);
        return {
          ...room
          // No unread_count property added
        };
      });

      debug.logProcessedRooms(roomsWithMeta);
      setRooms(roomsWithMeta);
      
    } catch (error) {
      debug.logUnexpectedError(error);
      toast.error('Failed to load chat rooms');
    }
  };

  const subscribeToRooms = () => {
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
  };

  const handleRoomSelect = (room: ChatRoomData) => {
    debug.logRoomSelection(room);
    
    // Clear the unread count for the selected room by removing the property entirely
    const updatedRooms = rooms.map(r => {
      if (r.id === room.id) {
        const { unread_count, ...roomWithoutUnreadCount } = r;
        return roomWithoutUnreadCount;
      }
      return r;
    });
    setRooms(updatedRooms);
    
    // Pass the room without unread_count to parent
    const { unread_count, ...roomWithoutUnreadCount } = room;
    onRoomSelect(roomWithoutUnreadCount);
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  debug.logRenderState(rooms, filteredRooms, searchQuery, canCreateRooms());

  return (
    <Card className="h-full flex flex-col border-0 rounded-none">
      <div className="p-4 border-b border-border dark:border-gray-800">
        <ChatRoomsHeader
          canCreateRooms={canCreateRooms()}
          onCreateRoom={() => setIsCreateRoomOpen(true)}
        />
        
        <ChatRoomsSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
      
      <ScrollArea className="flex-1 p-3">
        {filteredRooms.length > 0 ? (
          <ChatRoomsList
            rooms={filteredRooms}
            selectedRoom={selectedRoom}
            onRoomSelect={handleRoomSelect}
          />
        ) : (
          <ChatRoomsEmptyState
            searchQuery={searchQuery}
            roomsCount={rooms.length}
          />
        )}
      </ScrollArea>

      {canCreateRooms() && (
        <CreateRoomDialog
          open={isCreateRoomOpen}
          onOpenChange={setIsCreateRoomOpen}
        />
      )}
    </Card>
  );
};

export default ChatRooms;
