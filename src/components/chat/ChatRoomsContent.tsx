
import React from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatRoomsHeader from './ChatRoomsHeader';
import ChatRoomsSearch from './ChatRoomsSearch';
import ChatRoomsList from './ChatRoomsList';
import ChatRoomsEmptyState from './ChatRoomsEmptyState';
import CreateRoomDialog from './CreateRoomDialog';

interface ChatRoomData {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  last_message_at?: string;
  unread_count?: number;
}

interface ChatRoomsContentProps {
  filteredRooms: ChatRoomData[];
  selectedRoom: ChatRoomData | null;
  onRoomSelect: (room: ChatRoomData) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  canCreateRooms: boolean;
  onCreateRoom: () => void;
  isCreateRoomOpen: boolean;
  onCreateRoomOpenChange: (open: boolean) => void;
  roomsCount: number;
}

const ChatRoomsContent: React.FC<ChatRoomsContentProps> = ({
  filteredRooms,
  selectedRoom,
  onRoomSelect,
  searchQuery,
  onSearchChange,
  canCreateRooms,
  onCreateRoom,
  isCreateRoomOpen,
  onCreateRoomOpenChange,
  roomsCount
}) => {
  return (
    <Card className="h-full flex flex-col border-0 rounded-none">
      <div className="p-4 border-b border-border dark:border-gray-800">
        <ChatRoomsHeader
          canCreateRooms={canCreateRooms}
          onCreateRoom={onCreateRoom}
        />
        
        <ChatRoomsSearch
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
      </div>
      
      <ScrollArea className="flex-1 p-3">
        {filteredRooms.length > 0 ? (
          <ChatRoomsList
            rooms={filteredRooms}
            selectedRoom={selectedRoom}
            onRoomSelect={onRoomSelect}
          />
        ) : (
          <ChatRoomsEmptyState
            searchQuery={searchQuery}
            roomsCount={roomsCount}
          />
        )}
      </ScrollArea>

      {canCreateRooms && (
        <CreateRoomDialog
          open={isCreateRoomOpen}
          onOpenChange={onCreateRoomOpenChange}
        />
      )}
    </Card>
  );
};

export default ChatRoomsContent;
