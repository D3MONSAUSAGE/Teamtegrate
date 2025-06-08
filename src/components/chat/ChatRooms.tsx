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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { canCreateRooms } = useChatPermissions();
  const debug = useChatRoomsDebug();
  
  useEffect(() => {
    if (user) {
      fetchRooms();
      const channel = subscribeToRooms();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchRooms = async () => {
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
      
      // The database policies will now handle access control automatically
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
      
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      debug.logUnexpectedError(error);
      
      if (error.message === 'Authentication required') {
        setError('Please log in to view chat rooms.');
        toast.error('Authentication required. Please log in again.');
      } else if (error.message?.includes('JWT')) {
        setError('Session expired. Please refresh the page.');
        toast.error('Session expired. Please refresh the page.');
      } else {
        setError(`Failed to load chat rooms: ${error.message}`);
        toast.error('Failed to load chat rooms');
      }
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col border-0 rounded-none">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading chat rooms...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full flex flex-col border-0 rounded-none">
        <div className="p-4 border-b border-border dark:border-gray-800">
          <ChatRoomsHeader
            canCreateRooms={canCreateRooms()}
            onCreateRoom={() => setIsCreateRoomOpen(true)}
          />
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-destructive mb-2">Error loading rooms</div>
            <div className="text-sm text-muted-foreground mb-4">{error}</div>
            <button 
              onClick={fetchRooms}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </Card>
    );
  }

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
