
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessagesSquare } from 'lucide-react';

interface ChatRoomsHeaderProps {
  canCreateRooms: boolean;
  onCreateRoom: () => void;
}

const ChatRoomsHeader: React.FC<ChatRoomsHeaderProps> = ({ canCreateRooms, onCreateRoom }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold text-lg flex items-center gap-2">
        <MessagesSquare className="h-5 w-5 text-primary" />
        Team Chat
      </h2>
      {canCreateRooms && (
        <Button
          size="sm"
          onClick={onCreateRoom}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      )}
    </div>
  );
};

export default ChatRoomsHeader;
