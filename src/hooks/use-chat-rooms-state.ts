
import { useState, useEffect } from 'react';
import { useChatRoomsFetch } from '@/hooks/use-chat-rooms-fetch';

interface ChatRoomData {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  last_message_at?: string;
  unread_count?: number;
}

export function useChatRoomsState() {
  const [rooms, setRooms] = useState<ChatRoomData[]>([]);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize the fetch hook
  const { fetchRooms } = useChatRoomsFetch({ 
    setRooms, 
    setIsLoading, 
    setError 
  });

  // Automatically fetch rooms when component mounts
  useEffect(() => {
    console.log('useChatRoomsState: Component mounted, fetching rooms...');
    fetchRooms();
  }, [fetchRooms]);

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoomSelect = (room: ChatRoomData, onRoomSelect: (room: ChatRoomData) => void) => {
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

  return {
    rooms,
    setRooms,
    isCreateRoomOpen,
    setIsCreateRoomOpen,
    searchQuery,
    setSearchQuery,
    isLoading,
    setIsLoading,
    error,
    setError,
    filteredRooms,
    handleRoomSelect,
    refetch: fetchRooms
  };
}
