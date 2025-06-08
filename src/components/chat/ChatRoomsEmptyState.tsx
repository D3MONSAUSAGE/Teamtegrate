
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ChatRoomsEmptyStateProps {
  searchQuery: string;
  roomsCount: number;
}

const ChatRoomsEmptyState: React.FC<ChatRoomsEmptyStateProps> = ({ searchQuery, roomsCount }) => {
  const { user } = useAuth();

  return (
    <div className="text-center py-8 text-muted-foreground">
      {searchQuery ? 'No matching rooms found' : 'No chat rooms available'}
      <div className="text-xs mt-2 text-muted-foreground/70">
        {roomsCount === 0 && !searchQuery && (
          <div>
            <p>Debug info:</p>
            <p>User: {user?.email}</p>
            <p>Role: {user?.role}</p>
            <p>Check console for detailed logs</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoomsEmptyState;
