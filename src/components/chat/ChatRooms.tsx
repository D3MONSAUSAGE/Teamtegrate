
import React from 'react';
import { useChatRoomsState } from '@/hooks/use-chat-rooms-state';
import { useChatPermissions } from '@/hooks/use-chat-permissions';
import ChatRoomsHeader from './ChatRoomsHeader';
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
  const { rooms, isLoading, error, refetch } = useChatRoomsState();
  const { canCreateRooms } = useChatPermissions();

  console.log('ChatRooms: Rendering with', rooms.length, 'rooms, loading:', isLoading, 'error:', error);

  return (
    <div className="h-full flex flex-col bg-background border-r">
      <ChatRoomsHeader 
        onRoomCreated={refetch}
        canCreateRooms={canCreateRooms()}
      />
      <ChatRoomsContent
        rooms={rooms}
        selectedRoom={selectedRoom}
        onRoomSelect={onRoomSelect}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
      />
    </div>
  );
};

export default ChatRooms;
