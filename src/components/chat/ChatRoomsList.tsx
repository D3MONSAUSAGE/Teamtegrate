
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChatRoomData {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  last_message_at?: string;
  unread_count?: number;
}

interface ChatRoomsListProps {
  rooms: ChatRoomData[];
  selectedRoom: ChatRoomData | null;
  onRoomSelect: (room: ChatRoomData) => void;
}

const ChatRoomsList: React.FC<ChatRoomsListProps> = ({ rooms, selectedRoom, onRoomSelect }) => {
  return (
    <div className="space-y-1">
      {rooms.map((room) => (
        <Button
          key={room.id}
          variant={selectedRoom?.id === room.id ? "default" : "ghost"}
          className="w-full justify-start font-normal relative"
          onClick={() => onRoomSelect(room)}
        >
          <div className="truncate flex-1 text-left">{room.name}</div>
          {(room.unread_count && room.unread_count > 0) && selectedRoom?.id !== room.id && (
            <Badge className="ml-2 bg-primary hover:bg-primary">{room.unread_count}</Badge>
          )}
        </Button>
      ))}
    </div>
  );
};

export default ChatRoomsList;
