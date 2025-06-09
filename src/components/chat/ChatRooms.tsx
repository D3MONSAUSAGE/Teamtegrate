
import React, { useEffect, useRef } from 'react';
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
  const subscriptionRef = useRef<any>(null);
  
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

  const { fetchRooms } = useChatRoomsFetch({
    setRooms,
    setIsLoading,
    setError
  });

  // Simplified subscription with proper cleanup
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchRooms();

    // Clean up any existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    // Create new subscription for room changes only
    subscriptionRef.current = supabase
      .channel('chat-rooms-simple')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_rooms' },
        (payload) => {
          console.log('ChatRooms: Room change detected:', payload.eventType);
          debug.logRealtimeUpdate(payload);
          // Simple refetch on any room change
          fetchRooms();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.id]); // Only depend on user.id to prevent recreation

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
