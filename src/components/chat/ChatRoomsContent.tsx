
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
  rooms: ChatRoomData[];
  selectedRoom: ChatRoomData | null;
  onRoomSelect: (room: ChatRoomData) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const ChatRoomsContent: React.FC<ChatRoomsContentProps> = ({
  rooms,
  selectedRoom,
  onRoomSelect,
  isLoading,
  error,
  onRetry
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isCreateRoomOpen, setIsCreateRoomOpen] = React.useState(false);

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center border-0 rounded-none">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading chat rooms...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full flex items-center justify-center border-0 rounded-none">
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <Button onClick={onRetry} size="sm">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border-0 rounded-none">
      <div className="p-4 border-b border-border dark:border-gray-800">
        <ChatRoomsHeader
          canCreateRooms={true}
          onCreateRoom={() => setIsCreateRoomOpen(true)}
          onRoomCreated={onRetry}
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
            onRoomSelect={onRoomSelect}
          />
        ) : (
          <ChatRoomsEmptyState
            searchQuery={searchQuery}
            roomsCount={rooms.length}
          />
        )}
      </ScrollArea>

      <CreateRoomDialog
        onRoomCreated={onRetry}
        canCreate={true}
      />
    </Card>
  );
};

export default ChatRoomsContent;
