
import React from 'react';
import { Card } from '@/components/ui/card';
import ChatRoomsHeader from './ChatRoomsHeader';

interface ChatRoomsErrorStateProps {
  error: string;
  canCreateRooms: boolean;
  onCreateRoom: () => void;
  onRetry: () => void;
}

const ChatRoomsErrorState: React.FC<ChatRoomsErrorStateProps> = ({ 
  error, 
  canCreateRooms, 
  onCreateRoom, 
  onRetry 
}) => {
  return (
    <Card className="h-full flex flex-col border-0 rounded-none">
      <div className="p-4 border-b border-border dark:border-gray-800">
        <ChatRoomsHeader
          canCreateRooms={canCreateRooms}
          onCreateRoom={onCreateRoom}
        />
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-destructive mb-2">Error loading rooms</div>
          <div className="text-sm text-muted-foreground mb-4">{error}</div>
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    </Card>
  );
};

export default ChatRoomsErrorState;
