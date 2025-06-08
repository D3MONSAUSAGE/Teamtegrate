
import React, { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useChatPermissions } from '@/hooks/use-chat-permissions';
import { useChatRoomsDebug } from '@/hooks/use-chat-rooms-debug';
import { useChatRoomsState } from '@/hooks/use-chat-rooms-state';
import { useChatRoomsFetch } from '@/hooks/use-chat-rooms-fetch';
import ChatRoomsLoadingState from './ChatRoomsLoadingState';
import ChatRoomsErrorState from './ChatRoomsErrorState';
import ChatRoomsContent from './ChatRoomsContent';

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
  const { user } = useAuth();
  const { canCreateRooms } = useChatPermissions();
  const debug = useChatRoomsDebug();
  
  const {
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
    handleRoomSelect
  } = useChatRoomsState();

  const { fetchRooms, subscribeToRooms } = useChatRoomsFetch({
    setRooms,
    setIsLoading,
    setError
  });
  
  useEffect(() => {
    if (user) {
      fetchRooms();
      const channel = subscribeToRooms();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchRooms, subscribeToRooms]);

  debug.logRenderState(rooms, filteredRooms, searchQuery, canCreateRooms());

  if (isLoading) {
    return <ChatRoomsLoadingState />;
  }

  if (error) {
    return (
      <ChatRoomsErrorState
        error={error}
        canCreateRooms={canCreateRooms()}
        onCreateRoom={() => setIsCreateRoomOpen(true)}
        onRetry={fetchRooms}
      />
    );
  }

  return (
    <ChatRoomsContent
      filteredRooms={filteredRooms}
      selectedRoom={selectedRoom}
      onRoomSelect={(room) => handleRoomSelect(room, onRoomSelect)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      canCreateRooms={canCreateRooms()}
      onCreateRoom={() => setIsCreateRoomOpen(true)}
      isCreateRoomOpen={isCreateRoomOpen}
      onCreateRoomOpenChange={setIsCreateRoomOpen}
      roomsCount={rooms.length}
    />
  );
};

export default ChatRooms;
